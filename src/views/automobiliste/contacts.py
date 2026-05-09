import flet as ft
from config import Config
from components.menu import AppMenu
from database.db_manager import DBManager

class ContactsAutoView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import CardContainer, SectionHeader
        
        # Mock contacts: mecanics we had interventions with
        contacts = DBManager().fetch_all("""
            SELECT DISTINCT u.* 
            FROM users u
            JOIN interventions i ON u.id = i.mecanicien_id
            JOIN demandes d ON i.demande_id = d.id
            WHERE d.client_id = ?
        """, (self.user.id,))
        
        items = []
        for c in contacts:
            items.append(
                CardContainer(
                    ft.ListTile(
                        leading=ft.CircleAvatar(content=ft.Text(c['name'][0])),
                        title=ft.Text(c['name'], weight="bold"),
                        subtitle=ft.Text(f"{c['mecanicien_type']} • {c['city']}"),
                        trailing=ft.Row([
                            ft.IconButton(ft.icons.PHONE, icon_color="green", on_click=lambda _: print(f"Appel {c['phone']}")),
                            ft.IconButton(ft.icons.CHAT, icon_color="blue", on_click=lambda _: self.page.go("/messages"))
                        ], tight=True)
                    )
                )
            )

        return ft.View(
            "/contacts",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Mes Contacts"),
                    bgcolor=Config.COLOR_PRIMARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Historique des contacts", "Mécaniciens déjà sollicités"),
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
