from flask import Flask, jsonify
from flask_cors import CORS
from app.controllers.user_controller import login_user, register_user
from app.models.user_model import UserModel
from app.models.request_model import RequestModel
from app.models.offer_model import OfferModel
from app.models.message_model import MessageModel
from app.models.intervention_model import InterventionModel
from app.models.location_model import LocationModel

app = Flask(__name__)
CORS(app)

@app.before_first_request
def init_database():
    UserModel.create_table()
    RequestModel.create_table()
    OfferModel.create_table()
    MessageModel.create_table()
    InterventionModel.create_table()
    LocationModel.create_table()

@app.route('/api/auth/register', methods=['POST'])
def register_endpoint():
    return register_user()

@app.route('/api/auth/login', methods=['POST'])
def login_endpoint():
    return login_user()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'wqaft-python-backend'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
