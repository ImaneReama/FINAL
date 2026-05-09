import flet as ft
from config import Config
from components.menu import AppMenu

class AccueilAutoView:
    def __init__(self, page: ft.Page):
        self.page = page
        self.user = page.session.get("user")

    def get_view(self):
        from views.common_components import CustomButton
        
        return ft.View(
            "/home",
            [
                ft.AppBar(
                    leading=ft.IconButton(ft.icons.MENU, on_click=lambda e: self.page.drawer.open_drawer()),
                    title=ft.Text("WQAFT - Accueil"),
                    bgcolor=Config.COLOR_PRIMARY,
                    color=Config.COLOR_WHITE,
                    actions=[
                        ft.IconButton(ft.icons.NOTIFICATIONS_OUTLINED, icon_color="white")
                    ]
                ),
                ft.Container(
                    content=ft.Column([
                        ft.Container(
                            content=ft.Column([
                                ft.Text("Bonjour,", size=18, color="#64748b"),
                                ft.Text(self.user.name, size=28, weight="800", color=Config.COLOR_SECONDARY),
                            ], spacing=0),
                            margin=ft.margin.only(bottom=20)
                        ),
                        
                        # SOS Button
                        ft.Container(
                            content=ft.Column([
                                ft.IconButton(ft.icons.WARNING_AMBER_ROUNDED, icon_color="white", icon_size=50),
                                ft.Text("JE SUIS EN PANNE", color="white", weight="900", size=20),
                                ft.Text("Trouver un dépanneur immédiatement", color="white", size=12),
                            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                            bgcolor=Config.COLOR_ACCENT,
                            padding=30,
                            border_radius=25,
                            on_click=lambda _: print("SOS Clicked"),
                            alignment=ft.alignment.center,
                            shadow=ft.BoxShadow(blur_radius=20, color=ft.colors.with_opacity(0.3, Config.COLOR_ACCENT))
                        ),
                        
                        ft.Divider(height=40, color="transparent"),
                        
                        ft.Text("Services", size=20, weight="bold", color=Config.COLOR_SECONDARY),
                        ft.Row([
                            self.service_card("Remorquage", ft.icons.TOW_TRUCK, "blue"),
                            self.service_card("Batterie", ft.icons.BATTERY_ALERT, "orange"),
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        ft.Row([
                            self.service_card("Pneu Crevé", ft.icons.TIRE_REPAIR, "green"),
                            self.service_card("Diagnostic", ft.icons.COMPUTER, "purple"),
                        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                        
                    ], spacing=10, scroll=ft.ScrollMode.ALWAYS),
                    padding=20,
                    expand=True
                ),
                ft.BottomAppBar(
                    content=ft.Row([
                        ft.IconButton(ft.icons.HOME, icon_color=Config.COLOR_PRIMARY),
                        ft.IconButton(ft.icons.MAP_OUTLINED),
                        ft.IconButton(ft.icons.CHAT_BUBBLE_OUTLINE),
                        ft.IconButton(ft.icons.PERSON_OUTLINE),
                    ], alignment=ft.MainAxisAlignment.SPACE_AROUND),
                    bgcolor=Config.COLOR_WHITE,
                    height=70
                )
            ],
            drawer=AppMenu(self.page),
            bgcolor=Config.COLOR_BG_SLATE
        )

    def service_card(self, title, icon, color):
        return ft.Container(
            content=ft.Column([
                ft.Icon(icon, size=30, color=color),
                ft.Text(title, size=14, weight="600"),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, alignment=ft.MainAxisAlignment.CENTER),
            bgcolor=Config.COLOR_WHITE,
            width=165,
            height=100,
            border_radius=15,
            on_click=lambda _: print(f"Service {title}"),
        )
