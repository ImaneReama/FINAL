import flet as ft
from config import Config
from models.user import User
from utils.auth import verify_password, hash_password

class AuthView:
    def __init__(self, page: ft.Page):
        self.page = page

    def login_screen(self):
        email_ref = ft.TextField(label="Email", border_radius=10, prefix_icon=ft.icons.EMAIL)
        password_ref = ft.TextField(label="Mot de passe", password=True, can_reveal_password=True, border_radius=10, prefix_icon=ft.icons.LOCK)
        error_text = ft.Text(color="red", size=12)

        def handle_login(e):
            user = User.get_by_email(email_ref.value)
            if user and verify_password(user.password, password_ref.value):
                # Robust session set
                try:
                    self.page.session.set("user", user)
                except AttributeError:
                    try:
                        self.page.session["user"] = user
                    except Exception:
                        pass
                self.page.go("/home")
            else:
                error_text.value = "Identifiants invalides"
                self.page.update()

        return ft.View(
            "/login",
            [
                ft.Container(
                    content=ft.Column([
                        ft.Icon(ft.icons.WRENCH_ROUNDED, size=80, color=Config.COLOR_PRIMARY),
                        ft.Text("WQAFT", size=42, weight="900", color=Config.COLOR_SECONDARY),
                        ft.Text("Dépannage rapide au Maroc", size=14, color="#64748b"),
                        ft.VerticalDivider(height=20, color="transparent"),
                        email_ref,
                        password_ref,
                        error_text,
                        ft.ElevatedButton("Se connecter", on_click=handle_login, bgcolor=Config.COLOR_PRIMARY, color="white", width=300, height=50),
                        ft.TextButton("Pas de compte ? Inscrivez-vous", on_click=lambda _: self.page.go("/register"))
                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=15),
                    alignment=ft.alignment.center,
                    expand=True,
                    padding=20
                )
            ],
            bgcolor=Config.COLOR_WHITE
        )

    def register_screen(self):
        name_ref = ft.TextField(label="Nom complet", border_radius=10)
        email_ref = ft.TextField(label="Email", border_radius=10)
        password_ref = ft.TextField(label="Mot de passe", password=True, border_radius=10)
        role_toggle = ft.RadioGroup(content=ft.Row([
            ft.Radio(value="automobiliste", label="Client"),
            ft.Radio(value="mecanicien", label="Mécano")
        ], alignment=ft.MainAxisAlignment.CENTER))
        role_toggle.value = "automobiliste"

        def handle_register(e):
            pwd = hash_password(password_ref.value)
            User.create(name_ref.value, email_ref.value, pwd, role_toggle.value)
            self.page.go("/login")

        return ft.View(
            "/register",
            [
                ft.AppBar(title=ft.Text("Création de compte"), bgcolor=Config.COLOR_PRIMARY, color="white"),
                ft.Container(
                    content=ft.Column([
                        name_ref, email_ref, password_ref,
                        ft.Text("Je suis :", weight="bold"),
                        role_toggle,
                        ft.ElevatedButton("Finaliser l'inscription", on_click=handle_register, bgcolor=Config.COLOR_PRIMARY, color="white", width=float("inf"), height=50),
                    ], spacing=20),
                    padding=30
                )
            ]
        )
