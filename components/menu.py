import flet as ft
from config import Config

class AppMenu(ft.NavigationDrawer):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.user = page.session.get("user")
        
        # Build common destinations
        destinations = [
            ft.NavigationDrawerDestination(
                icon=ft.icons.HOME_ROUNDED,
                label="Accueil",
            ),
            ft.NavigationDrawerDestination(
                icon=ft.icons.PERSON_ROUNDED,
                label="Profil",
            ),
        ]
        
        if self.user and self.user.role == "automobiliste":
            destinations.extend([
                ft.NavigationDrawerDestination(
                    icon=ft.icons.CONTACTS_ROUNDED,
                    label="Mes Contacts",
                ),
                ft.NavigationDrawerDestination(
                    icon=ft.icons.CHAT,
                    label="Messages",
                ),
                ft.NavigationDrawerDestination(
                    icon=ft.icons.SETTINGS_ROUNDED,
                    label="Paramètres",
                ),
            ])
        elif self.user and self.user.role == "mecanicien":
            destinations.extend([
                ft.NavigationDrawerDestination(
                    icon=ft.icons.WORK_ROUNDED,
                    label="Demandes",
                ),
                ft.NavigationDrawerDestination(
                    icon=ft.icons.HISTORY_ROUNDED,
                    label="Interventions",
                ),
                ft.NavigationDrawerDestination(
                    icon=ft.icons.CHAT,
                    label="Messagerie",
                ),
                ft.NavigationDrawerDestination(
                    icon=ft.icons.SETTINGS_ROUNDED,
                    label="Paramètres Pro",
                ),
            ])

        self.destinations = destinations
        self.on_change = self.handle_change

    def handle_change(self, e):
        dest = self.destinations[self.selected_index].label
        if dest == "Accueil":
            self.page.go("/home")
        elif dest == "Profil":
            self.page.go("/profil")
        elif dest == "Mes Contacts":
            self.page.go("/contacts")
        elif dest == "Messages" or dest == "Messagerie":
            self.page.go("/messages")
        elif dest == "Paramètres" or dest == "Paramètres Pro":
            self.page.go("/settings")
        elif dest == "Demandes":
            self.page.go("/demandes")
        elif dest == "Interventions":
            self.page.go("/interventions")
        
    def open_drawer(self):
        self.page.drawer = self
        self.open = True
        self.page.update()
