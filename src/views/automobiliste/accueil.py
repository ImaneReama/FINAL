import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager
import datetime
import threading
import time

class AccueilAutoView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")
        self.active_request = None
        self.timer_text = ft.Text("", size=20, weight="bold", color=Config.COLOR_ACCENT)
        self.offers_container = ft.Column(spacing=10)
        self.request_container = ft.Container(visible=False)
        self.is_running = False

    def get_view(self):
        from views.common_components import CustomButton
        
        # Initial check for active request
        self.check_active_request()

        view = ft.View(
            "/home",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("WQAFT - Accueil"),
                    bgcolor=Config.COLOR_PRIMARY,
                    color=Config.COLOR_WHITE,
                    actions=[
                        ft.IconButton(ft.icons.NOTIFICATIONS_OUTLINED, icon_color="white")
                    ]
                ),
                ft.Container(
                    content=ft.Column([
                        ft.Container(
                            content=ft.Column([
                                ft.Text("Bonjour,", size=18, color="#64748b"),
                                ft.Text(self.user.name if hasattr(self.user, 'name') else "Utilisateur", size=28, weight="800", color=Config.COLOR_SECONDARY),
                            ], spacing=0),
                            margin=ft.margin.only(bottom=20)
                        ),
                        
                        # Active Request Display
                        self.request_container,

                        # SOS Button
                        ft.Container(
                            content=ft.Column([
                                ft.IconButton(ft.icons.WARNING_AMBER_ROUNDED, icon_color="white", icon_size=50),
                                ft.Text("JE SUIS EN PANNE", color="white", weight="900", size=20),
                                ft.Text("Trouver un dépanneur immédiatement", color="white", size=12),
                            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                            bgcolor=Config.COLOR_ACCENT,
                            padding=30,
                            border_radius=25,
                            on_click=self.create_test_request,
                            alignment=ft.alignment.center,
                            shadow=ft.BoxShadow(blur_radius=20, color=ft.colors.with_opacity(0.3, Config.COLOR_ACCENT)),
                            visible=not self.active_request
                        ),
                        
                        ft.Divider(height=40, color="transparent"),
                        
                        ft.Text("Services", size=20, weight="bold", color=Config.COLOR_SECONDARY),
                        ft.Row([
                            self.service_card("Remorquage", ft.icons.TOW_TRUCK, "blue"),
                            self.service_card("Batterie", ft.icons.BATTERY_ALERT, "orange"),
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        ft.Row([
                            self.service_card("Pneu Crevé", ft.icons.TIRE_REPAIR, "green"),
                            self.service_card("Diagnostic", ft.icons.COMPUTER, "purple"),
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        
                    ], spacing=10, scroll=ft.ScrollMode.ALWAYS),
                    padding=20,
                    expand=True
                ),
                ft.BottomAppBar(
                    content=ft.Row([
                        ft.IconButton(ft.icons.HOME, icon_color=Config.COLOR_PRIMARY),
                        ft.IconButton(ft.icons.MAP_OUTLINED),
                        ft.IconButton(ft.icons.CHAT_BUBBLE_OUTLINE),
                        ft.IconButton(ft.icons.PERSON_OUTLINE),
                    ], alignment=ft.MainAxisAlignment.SPACE_AROUND),
                    bgcolor=Config.COLOR_WHITE,
                    height=70
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )

        if self.active_request:
            self.start_timer_thread()

        return view

    def check_active_request(self):
        db = DBManager()
        # Find pending request within 5 minutes
        query = """
            SELECT *, 
            (strftime('%s', 'now') - strftime('%s', created_at)) as elapsed 
            FROM demandes 
            WHERE client_id = ? AND status = 'pending' 
            AND (strftime('%s', 'now') - strftime('%s', created_at)) < 300
            ORDER BY created_at DESC LIMIT 1
        """
        self.active_request = db.fetch_one(query, (self.user.id,))
        if self.active_request:
            self.update_request_ui()

    def update_request_ui(self):
        from views.common_components import CardContainer
        self.request_container.content = CardContainer(
            ft.Column([
                ft.Row([
                    ft.Text("Demande en cours", weight="bold", size=18),
                    self.timer_text
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                ft.Text(f"Catégorie: {self.active_request['category']}"),
                ft.Text(self.active_request['description']),
                ft.Divider(),
                ft.Text("Propositions reçues:", weight="bold"),
                self.offers_container
            ])
        )
        self.request_container.visible = True
        self.update_offers()

    def update_offers(self):
        db = DBManager()
        offers = db.fetch_all("""
            SELECT o.*, u.name as mech_name 
            FROM offers o 
            JOIN users u ON o.mecanicien_id = u.id 
            WHERE o.demande_id = ? AND o.status = 'pending'
        """, (self.active_request['id'],))
        
        self.offers_container.controls.clear()
        for off in offers:
            self.offers_container.controls.append(
                ft.Container(
                    content=ft.Row([
                        ft.Column([
                            ft.Text(off['mech_name'], weight="bold"),
                            ft.Text(f"{off['price']} DH", color=Config.COLOR_PRIMARY, size=16, weight="bold"),
                        ], expand=True),
                        ft.Row([
                            ft.IconButton(ft.icons.CHECK_CIRCLE, icon_color="green", on_click=lambda e, o=off: self.accept_offer(o)),
                            ft.IconButton(ft.icons.CANCEL, icon_color="red", on_click=lambda e, o=off: self.refuse_offer(o)),
                        ])
                    ]),
                    padding=10,
                    bgcolor="#f8fafc",
                    border_radius=10
                )
            )
        if not offers:
            self.offers_container.controls.append(ft.Text("En attente de dépanneurs...", italic=True, color="grey"))
        
        if self.page:
            self.page.update()

    def start_timer_thread(self):
        if not self.is_running:
            self.is_running = True
            threading.Thread(target=self.timer_worker, daemon=True).start()

    def timer_worker(self):
        while self.is_running and self.active_request:
            db = DBManager()
            req = db.fetch_one("SELECT created_at, status FROM demandes WHERE id = ?", (self.active_request['id'],))
            if not req or req['status'] != 'pending':
                self.is_running = False
                break
            
            # Using UTC-ish comparison or assuming DB and local match
            # SQLite strftime('%s', 'now') is UTC
            res = db.fetch_one("SELECT (strftime('%s', 'now') - strftime('%s', ?)) as elapsed", (req['created_at'],))
            elapsed = res['elapsed']
            remaining = 300 - elapsed
            
            if remaining <= 0:
                # Timeout
                from app.models.request_model import RequestModel
                RequestModel.update_status(self.active_request['id'], 'expired')
                self.active_request = None
                self.is_running = False
                break
            
            mins, secs = divmod(remaining, 60)
            self.timer_text.value = f"{mins:02d}:{secs:02d}"
            
            self.update_offers()
            time.sleep(2)
        
        # UI Update when loop ends
        def sync_ui():
            self.request_container.visible = False
            # Find SOS button and make it visible (hacky but works)
            # Better to have a reference
            self.page.go("/home") # Refresh view
        
        if self.page:
            self.page.run_task(sync_ui) if hasattr(self.page, 'run_task') else sync_ui()

    def create_test_request(self, _):
        from app.models.request_model import RequestModel
        data = {
            'client_id': self.user.id,
            'category': 'Panne Moteur',
            'description': 'Ma voiture ne démarre plus, fumée blanche.',
            'lat': Config.MOCK_LAT,
            'lng': Config.MOCK_LNG,
            'status': 'pending'
        }
        RequestModel.create_request(data)
        self.check_active_request()
        if self.active_request:
            self.start_timer_thread()
            self.page.update()

    def accept_offer(self, offer):
        from app.models.offer_model import OfferModel
        from app.models.request_model import RequestModel
        from app.models.intervention_model import InterventionModel
        
        OfferModel.update_status(offer['id'], 'accepted')
        RequestModel.update_status(self.active_request['id'], 'accepted')
        
        InterventionModel.create_intervention({
            'demande_id': self.active_request['id'],
            'mecanicien_id': offer['mecanicien_id'],
            'final_price': offer['price'],
            'status': 'ongoing'
        })
        
        self.active_request = None
        self.is_running = False
        self.page.go("/home") # Refresh to show normal home or intervention link

    def refuse_offer(self, offer):
        from app.models.offer_model import OfferModel
        OfferModel.update_status(offer['id'], 'refused')
        self.update_offers()

    def service_card(self, title, icon, color):
        return ft.Container(
            content=ft.Column([
                ft.Icon(icon, size=30, color=color),
                ft.Text(title, size=14, weight="600"),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, alignment=ft.MainAxisAlignment.CENTER),
            bgcolor=Config.COLOR_WHITE,
            width=165,
            height=100,
            border_radius=15,
            on_click=lambda _: print(f"Service {title}"),
        )
