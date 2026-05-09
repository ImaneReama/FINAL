import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager

class MessagesAutoView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import CardContainer, SectionHeader
        
        # Get active conversations (demandes where we have messages or offers)
        convs = DBManager().fetch_all("""
            SELECT DISTINCT d.id, d.category, u.name as meca_name, m.content as last_msg
            FROM demandes d
            LEFT JOIN messages m ON d.id = m.demande_id
            LEFT JOIN users u ON u.role = 'mecanicien' -- Mock joining with meca
            WHERE d.client_id = ?
            GROUP BY d.id
        """, (self.user.id,))
        
        items = []
        for c in convs:
            items.append(
                CardContainer(
                    ft.ListTile(
                        leading=ft.CircleAvatar(content=ft.Text(c['category'][0] if c['category'] else "?")),
                        title=ft.Text(f"Chat: {c['category']}", weight="bold"),
                        subtitle=ft.Text(c['last_msg'] or "Aucun message"),
                        on_click=lambda _: print("Open chat")
                    )
                )
            )

        return ft.View(
            "/messages",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Messages"),
                    bgcolor=Config.COLOR_PRIMARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Vos conversations", "Suivez vos négociations"),
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
