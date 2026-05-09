import sys
import os
from pathlib import Path
 
# Ajoute la racine du projet ET le dossier 'src' au chemin de recherche Python
# FIX 1: la racine est nécessaire pour config, database, components
#         src/ est nécessaire pour les views Flet
_root = str(Path(__file__).parent)
_src  = str(Path(__file__).parent / 'src')
if _root not in sys.path:
    sys.path.insert(0, _root)
if _src not in sys.path:
    sys.path.insert(0, _src)
 
import flet as ft
from config import Config
from database.init_db import init_db
from views.auth_view import AuthView
# FIX 2: AppMenu retiré — il n'est jamais utilisé directement ici
# FIX 3: AccueilAutoView et MechDashboardView retirés du niveau module —
#         ils sont importés à la demande dans route_change (lazy imports)
 
 
def main(page: ft.Page):
    page.title = Config.APP_NAME
    page.theme_mode = ft.ThemeMode.LIGHT
    page.window_width = 400
    page.window_height = 800
 
    page.theme = ft.Theme(
        color_scheme=ft.ColorScheme(
            primary=Config.COLOR_PRIMARY,
            secondary=Config.COLOR_SECONDARY,
        )
    )
 
    auth_views = AuthView(page)
 
    def route_change(route):
        page.views.clear()
        # Robust session access to avoid AttributeError: 'Session' object has no attribute 'get'
        user = None
        try:
            user = page.session.get("user")
        except AttributeError:
            try:
                user = page.session["user"]
            except (KeyError, TypeError):
                user = None
        except Exception:
            user = None
 
        if page.route in ("/login", "/register"):
            # FIX 7: si l'utilisateur est déjà connecté, on le redirige
            if user:
                page.go("/home")
                return
            if page.route == "/login":
                page.views.append(auth_views.login_screen())
            else:
                page.views.append(auth_views.register_screen())
 
        elif not user:
            page.go("/login")
 
        else:
            if page.route == "/home":
                if user.role == "automobiliste":
                    from views.automobiliste.accueil import AccueilAutoView
                    page.views.append(AccueilAutoView(page).get_view())
                elif user.role == "mecanicien":
                    from views.mecanicien.dashboard import MechDashboardView
                    page.views.append(MechDashboardView(page).get_view())
                else:
                    page.views.append(ft.View("/home", [ft.Text("Rôle inconnu")]))
 
            elif page.route == "/profil":
                if user.role == "automobiliste":
                    from views.automobiliste.profil import ProfilAutoView
                    page.views.append(ProfilAutoView(page).get_view())
                else:
                    from views.mecanicien.profil import ProfilMechView
                    page.views.append(ProfilMechView(page).get_view())
 
            elif page.route == "/messages":
                if user.role == "automobiliste":
                    from views.automobiliste.messages import MessagesAutoView
                    page.views.append(MessagesAutoView(page).get_view())
                else:
                    from views.mecanicien.messagerie import MessagesMechView
                    page.views.append(MessagesMechView(page).get_view())
 
            elif page.route == "/contacts" and user.role == "automobiliste":
                from views.automobiliste.contacts import ContactsAutoView
                page.views.append(ContactsAutoView(page).get_view())
 
            elif page.route == "/settings":
                if user.role == "automobiliste":
                    from views.automobiliste.parametres import SettingsAutoView
                    page.views.append(SettingsAutoView(page).get_view())
                else:
                    from views.mecanicien.parametres import SettingsMechView
                    page.views.append(SettingsMechView(page).get_view())
 
            elif page.route == "/demandes" and user.role == "mecanicien":
                from views.mecanicien.demandes import DemandesMechView
                page.views.append(DemandesMechView(page).get_view())
 
            elif page.route == "/interventions" and user.role == "mecanicien":
                from views.mecanicien.interventions import InterventionsMechView
                page.views.append(InterventionsMechView(page).get_view())
 
            else:
                page.views.append(ft.View("/404", [ft.Text("Page non trouvée")]))
 
        page.update()
 
    def view_pop(view):
        # FIX 6: évite un IndexError si la pile de vues est déjà vide
        if len(page.views) > 1:
            page.views.pop()
            top_view = page.views[-1]
            page.go(top_view.route)
        else:
            page.go("/login")
 
    page.on_route_change = route_change
    page.on_view_pop = view_pop
 
    page.go("/login")
 
 
if __name__ == "__main__":
    try:
        # FIX 4 & 5: suppression de drop_all (détruisait les données à chaque démarrage)
        #            et suppression de la création via SQLAlchemy (conflit de schéma
        #            avec la base SQLite gérée par DBManager / init_db).
        #            init_db() gère toutes les tables nécessaires à l'appli Flet.
        init_db()
 
        port = int(os.environ.get("PORT", 3000))
        ft.app(target=main, port=port, host="0.0.0.0", view=ft.AppView.WEB_BROWSER)
    except Exception as e:
        print(f"Erreur au démarrage : {e}")
 