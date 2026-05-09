import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager

class MechDashboardView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import SectionHeader, CardContainer, StatusBadge
        
        # Stats summary
        stats = ft.Row([
            self.stat_box("Demandes", "12", ft.colors.BLUE_400),
            self.stat_box("Réussis", "85", ft.colors.GREEN_400),
            self.stat_box("Note", str(self.user.rating), ft.colors.AMBER_400),
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN)

        # Mock list of pending requests
        requests = DBManager().fetch_all("""
            SELECT d.*, u.name as client_name 
            FROM demandes d
            JOIN users u ON d.client_id = u.id
            WHERE d.status = 'pending'
            LIMIT 5
        """)
        
        request_items = []
        for r in requests:
            request_items.append(
                ft.ListTile(
                    leading=ft.Icon(ft.icons.REPORT_PROBLEM),
                    title=ft.Text(f"{r['client_name']} - {r['category']}"),
                    subtitle=ft.Text(r['description']),
                    trailing=ft.ElevatedButton("Détails", on_click=lambda _: self.page.go(f"/demande/{r['id']}"))
                )
            )

        return ft.View(
            "/home",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("WQAFT - Dashboard Pro"),
                    bgcolor=Config.COLOR_SECONDARY,
                    color=Config.COLOR_WHITE,
                    actions=[
                        ft.Switch(label="En ligne", value=True, on_change=lambda e: print("Status changed"))
                    ]
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Tableau de bord", "Gérez votre activité professionnelle"),
                        stats,
                        ft.Divider(height=40, color="transparent"),
                        ft.Text("Demandes à proximité", size=18, weight="bold"),
                        CardContainer(
                            ft.Column(request_items) if request_items else ft.Text("Aucune demande active")
                        )
                    ], spacing=15, scroll=ft.ScrollMode.ALWAYS),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )

    def stat_box(self, label, value, color):
        return ft.Container(
            content=ft.Column([
                ft.Text(value, size=24, weight="bold", color=color),
                ft.Text(label, size=12, color="#64748b"),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
            bgcolor=Config.COLOR_WHITE,
            padding=15,
            border_radius=15,
            width=110,
            shadow=ft.BoxShadow(blur_radius=10, color=ft.colors.with_opacity(0.05, ft.colors.BLACK))
        )
