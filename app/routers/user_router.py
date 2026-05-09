from flask import Blueprint
from app.controllers.user_controller import register, login

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/auth/register', methods=['POST'])
def register_route():
    return register()

@user_bp.route('/api/auth/login', methods=['POST'])
def login_route():
    return login()