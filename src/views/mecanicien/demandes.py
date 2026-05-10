import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager
import threading
import time
from app.models.offer_model import OfferModel

class DemandesMechView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")
        self.items_container = ft.Column(spacing=15, scroll=ft.ScrollMode.ALWAYS, expand=True)
        self.is_running = False

    def get_view(self):
        from views.common_components import SectionHeader
        
        view = ft.View(
            "/demandes",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Demandes à proximité"),
                    bgcolor=Config.COLOR_SECONDARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Flux de demandes", "Répondez aux appels à l'aide"),
                        ft.Divider(),
                        self.items_container
                    ], spacing=20),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )

        self.start_refresh_thread()
        return view

    def start_refresh_thread(self):
        if not self.is_running:
            self.is_running = True
            threading.Thread(target=self.refresh_worker, daemon=True).start()

    def refresh_worker(self):
        while self.is_running:
            if self.page:
                self.update_demandes_list()
            time.sleep(2)

    def update_demandes_list(self):
        from views.common_components import CardContainer, StatusBadge
        db = DBManager()
        
        # Fetch requests that are pending and within 5 minutes
        demandes = db.fetch_all("""
            SELECT d.*, u.name as client_name,
            (strftime('%s', 'now') - strftime('%s', d.created_at)) as elapsed
            FROM demandes d
            JOIN users u ON d.client_id = u.id
            WHERE d.status = 'pending' AND (strftime('%s', 'now') - strftime('%s', d.created_at)) < 300
            ORDER BY d.created_at DESC
        """)
        
        controls = []
        for d in demandes:
            remaining = 300 - d['elapsed']
            mins, secs = divmod(remaining, 60)
            timer_str = f"{mins:02d}:{secs:02d}"

            # Check if this mechanic already made an offer
            offer = db.fetch_one("""
                SELECT *, (strftime('%s', 'now') - strftime('%s', refused_at)) as refused_elapsed 
                FROM offers 
                WHERE demande_id = ? AND mecanicien_id = ?
                ORDER BY created_at DESC LIMIT 1
            """, (d['id'], self.user.id))

            status_text = "Nouvelle"
            status_bg = "#defadb"
            status_color = "#15803d"
            
            action_buttons = []
            
            if not offer:
                action_buttons = [
                    ft.ElevatedButton("Ignorer", icon=ft.icons.CLOSE, color="red"),
                    ft.ElevatedButton("Proposer un prix", 
                                    icon=ft.icons.BID_ON_ITEM, 
                                    bgcolor=Config.COLOR_PRIMARY, 
                                    color="white",
                                    on_click=lambda e, req=d: self.open_offer_dialog(req))
                ]
            elif offer['status'] == 'pending':
                status_text = "En attente de réponse"
                status_bg = "#fef9c3"
                status_color = "#854d0e"
                action_buttons = [ft.Text("Offre envoyée", italic=True, color="grey")]
            elif offer['status'] == 'refused':
                # Check 2-minute visibility
                if offer['refused_elapsed'] > 120:
                    continue # Hide from list after 2 minutes
                
                status_text = "Proposition refusée"
                status_bg = "#fee2e2"
                status_color = "#991b1b"
                
                refused_remaining = 120 - offer['refused_elapsed']
                rmins, rsecs = divmod(refused_remaining, 60)
                
                action_buttons = [
                    ft.Text(f"Disparaît dans {rmins:02d}:{rsecs:02d}", size=12, color="grey"),
                    ft.ElevatedButton("Reproposer", 
                                    icon=ft.icons.REPLAY, 
                                    bgcolor=Config.COLOR_PRIMARY, 
                                    color="white",
                                    on_click=lambda e, req=d: self.open_offer_dialog(req))
                ]
            elif offer['status'] == 'accepted':
                continue # Should probably not be in "Demandes" anymore

            controls.append(
                CardContainer(
                    ft.Column([
                        ft.Row([
                            ft.Column([
                                ft.Text(f"{d['client_name']} ({d['category']})", weight="bold", size=16),
                                ft.Text(timer_str, color=Config.COLOR_ACCENT, weight="bold"),
                            ], spacing=0),
                            StatusBadge(status_text, status_bg, status_color)
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        ft.Text(d['description'], size=14),
                        ft.Row([
                            ft.Icon(ft.icons.LOCATION_ON, size=16, color="grey"),
                            ft.Text("À proximité", size=12, color="grey")
                        ]),
                        ft.Row(action_buttons, alignment=ft.MainAxisAlignment.END)
                    ], spacing=10)
                )
            )

        self.items_container.controls = controls
        if self.page:
            self.page.update()

    def open_offer_dialog(self, request):
        price_field = ft.TextField(label="Prix (DH)", keyboard_type=ft.KeyboardType.NUMBER)
        
        def send_offer(e):
            if not price_field.value:
                return
            
            # If there was a refused offer, we might want to update it or create new one.
            # The prompt says "proposer un nouveau prix (une autre offre)".
            # We'll create a new record or update the existing one to 'pending'.
            # Updating is cleaner for the UI logic I wrote.
            
            db = DBManager()
            existing = db.fetch_one("SELECT id FROM offers WHERE demande_id = ? AND mecanicien_id = ?", (request['id'], self.user.id))
            
            if existing:
                db.execute("UPDATE offers SET price = ?, status = 'pending', refused_at = NULL, created_at = CURRENT_TIMESTAMP WHERE id = ?", 
                           (float(price_field.value), existing['id']))
            else:
                OfferModel.create_offer({
                    'demande_id': request['id'],
                    'mecanicien_id': self.user.id,
                    'price': float(price_field.value),
                    'status': 'pending'
                })
            
            dialog.open = False
            self.page.update()
            self.update_demandes_list()

        dialog = ft.AlertDialog(
            title=ft.Text("Proposer une offre"),
            content=ft.Column([
                ft.Text(f"Client: {request['client_name']}"),
                price_field
            ], tight=True),
            actions=[
                ft.TextButton("Annuler", on_click=lambda e: setattr(dialog, "open", False)),
                ft.ElevatedButton("Envoyer", on_click=send_offer, bgcolor=Config.COLOR_PRIMARY, color="white")
            ]
        )
        self.page.dialog = dialog
        dialog.open = True
        self.page.update()
