import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager

class InterventionsMechView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import CardContainer, SectionHeader, StatusBadge
        
        # Intervention list
        interventions = DBManager().fetch_all("""
            SELECT i.*, d.category, d.description, u.name as client_name 
            FROM interventions i
            JOIN demandes d ON i.demande_id = d.id
            JOIN users u ON d.client_id = u.id
            WHERE i.mecanicien_id = ?
            ORDER BY i.date_started DESC
        """, (self.user.id,))
        
        items = []
        for i in interventions:
            items.append(
                CardContainer(
                    ft.ListTile(
                        leading=ft.Icon(ft.icons.CAR_REPAIR, color=Config.COLOR_PRIMARY),
                        title=ft.Text(f"{i['client_name']} - {i['category']}", weight="bold"),
                        subtitle=ft.Text(f"Montant: {i['final_price']} DH | {i['date_started'][:10]}"),
                        trailing=StatusBadge(i['status'], "#e2e8f0", Config.COLOR_TEXT_MAIN)
                    )
                )
            )

        return ft.View(
            "/interventions",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Mes Interventions"),
                    bgcolor=Config.COLOR_SECONDARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Historique", "Toutes vos interventions passées"),
                        ft.Divider(),
                        ft.Column(items, spacing=10, scroll=ft.ScrollMode.ALWAYS, expand=True)
                    ], spacing=20),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )
