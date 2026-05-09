import flet as ft
from config import Config
from components.menu import AppMenu

class SettingsAutoView:
    def __init__(self, page: ft.Page):
        self.page = page

    def get_view(self):
        from views.common_components import SectionHeader
        
        return ft.View(
            "/settings",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Paramètres"),
                    bgcolor=Config.COLOR_PRIMARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Préférences", "Personnalisez votre expérience"),
                        ft.Divider(),
                        ft.ListTile(
                            leading=ft.Icon(ft.icons.LANGUAGE),
                            title=ft.Text("Langue"),
                            subtitle=ft.Text("Français (Maroc)"),
                            trailing=ft.Icon(ft.icons.CHEVRON_RIGHT)
                        ),
                        ft.ListTile(
                            leading=ft.Icon(ft.icons.DARK_MODE),
                            title=ft.Text("Thème sombre"),
                            trailing=ft.Switch(value=False)
                        ),
                        ft.ListTile(
                            leading=ft.Icon(ft.icons.MEASURE),
                            title=ft.Text("Unité de distance"),
                            subtitle=ft.Text("Kilomètres (km)"),
                        ),
                        ft.Divider(),
                        ft.TextButton("Conditions d'utilisation", icon=ft.icons.DESCRIPTION),
                        ft.TextButton("Politique de confidentialité", icon=ft.icons.PRIVACY_TIP),
                        ft.TextButton("Supprimer mon compte", icon=ft.icons.DELETE, icon_color="red", font_color="red"),
                    ], spacing=10, scroll=ft.ScrollMode.ALWAYS),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )
