import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager

class MessagesMechView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import CardContainer, SectionHeader
        
        # Similar mock logic
        convs = DBManager().fetch_all("""
            SELECT DISTINCT d.id, d.category, u.name as client_name, m.content as last_msg
            FROM demandes d
            LEFT JOIN messages m ON d.id = m.demande_id
            JOIN users u ON d.client_id = u.id
            ORDER BY m.created_at DESC
        """)
        
        items = []
        for c in convs:
            items.append(
                CardContainer(
                    ft.ListTile(
                        leading=ft.CircleAvatar(content=ft.Text(c['client_name'][0])),
                        title=ft.Text(c['client_name'], weight="bold"),
                        subtitle=ft.Text(f"{c['category']}: {c['last_msg'] or '...' }"),
                        on_click=lambda _: print("Open chat")
                    )
                )
            )

        return ft.View(
            "/messages",
            [
                # App Bar for mecano messages
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Messagerie Professionnelle"),
                    bgcolor=Config.COLOR_SECONDARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Chats clients", "Négociez et confirmez"),
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
