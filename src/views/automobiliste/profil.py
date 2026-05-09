import flet as ft
from config import Config
from components.menu import AppMenu

class ProfilAutoView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")
        self.name = ft.TextField(label="Nom complet", value=self.user.name, border_radius=10)
        self.phone = ft.TextField(label="Téléphone", value=self.user.phone or "", border_radius=10)
        self.city = ft.TextField(label="Ville", value=self.user.city or "", border_radius=10)

    def save_profile(self, e):
        self.user.update_profile(self.name.value, self.phone.value, self.city.value)
        self.page.snack_bar = ft.SnackBar(ft.Text("Profil mis à jour !"))
        self.page.snack_bar.open = True
        self.page.update()

    def get_view(self):
        from views.common_components import CardContainer, SectionHeader, CustomButton
        
        return ft.View(
            "/profil",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("Mon Profil"),
                    bgcolor=Config.COLOR_PRIMARY,
                    color=Config.COLOR_WHITE
                ),
                ft.Container(
                    content=ft.Column([
                        SectionHeader("Édition du profil", "Gérez vos informations personnelles"),
                        ft.Divider(),
                        CardContainer(
                            ft.Column([
                                ft.CircleAvatar(content=ft.Text(self.user.name[0]), radius=50, bgcolor=Config.COLOR_PRIMARY),
                                self.name,
                                self.phone,
                                self.city,
                                CustomButton("Enregistrer les modifications", self.save_profile, icon=ft.icons.SAVE, width=float("inf"))
                            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=20)
                        )
                    ], spacing=20, scroll=ft.ScrollMode.ALWAYS),
                    padding=20,
                    expand=True
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )
