import flet as ft
from config import Config
from components.menu import AppMenu

class SettingsMechView:
    def __init__(self, page: ft.Page):
        self.page = page

    def get_view(self):
        from views.common_components import SectionHeader
        
        return ft.View(
            "/settings",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Paramètres Pro"),
                    bgcolor=Config.COLOR_SECONDARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Préférences PRO", "Configurez votre visibilité"),
                        ft.Divider(),
                        ft.ListTile(
                            leading=ft.Icon(ft.icons.NOTIFICATIONS_ACTIVE),
                            title=ft.Text("Notifications de demandes"),
                            subtitle=ft.Text("Activé pour < 30km"),
                            trailing=ft.Switch(value=True)
                        ),
                        ft.ListTile(
                            leading=ft.Icon(ft.icons.LANGUAGE),
                            title=ft.Text("Langue"),
                            subtitle=ft.Text("Français"),
                        ),
                        ft.ListTile(
                            leading=ft.Icon(ft.icons.DARK_MODE),
                            title=ft.Text("Thème sombre"),
                            trailing=ft.Switch(value=False)
                        ),
                        ft.Divider(),
                        ft.TextButton("Support Technique", icon=ft.icons.HELP),
                        ft.TextButton("Déconnexion", icon=ft.icons.LOGOUT, on_click=lambda _: self.page.go("/login")),
                    ], spacing=10, scroll=ft.ScrollMode.ALWAYS),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )
