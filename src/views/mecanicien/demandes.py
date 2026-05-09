import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager

class DemandesMechView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import CardContainer, SectionHeader, StatusBadge
        
        demandes = DBManager().fetch_all("""
            SELECT d.*, u.name as client_name 
            FROM demandes d
            JOIN users u ON d.client_id = u.id
            WHERE d.status = 'pending'
            ORDER BY d.created_at DESC
        """)
        
        items = []
        for d in demandes:
            items.append(
                CardContainer(
                    ft.Column([
                        ft.Row([
                            ft.Text(f"{d['client_name']} ({d['category']})", weight="bold", size=16),
                            StatusBadge("Nouvelle", "#defadb", "#15803d")
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        ft.Text(d['description'], size=14),
                        ft.Row([
                            ft.Icon(ft.icons.LOCATION_ON, size=16, color="grey"),
                            ft.Text("Casablanca (1.2 km)", size=12, color="grey")
                        ]),
                        ft.Row([
                            ft.ElevatedButton("Ignorer", icon=ft.icons.CLOSE, color="red"),
                            ft.ElevatedButton("Proposer un prix", icon=ft.icons.BID_ON_ITEM, bgcolor=Config.COLOR_PRIMARY, color="white")
                        ], alignment=ft.MainAxisAlignment.END)
                    ], spacing=10)
                )
            )

        return ft.View(
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
                        ft.Column(items, spacing=15, scroll=ft.ScrollMode.ALWAYS, expand=True)
                    ], spacing=20),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )
