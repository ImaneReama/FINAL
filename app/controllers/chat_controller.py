from app.models.message_model import MessageModel
from flask import request, jsonify


def send_message():
    payload = request.get_json() or {}
    if not payload.get('demande_id') or not payload.get('sender_id') or not payload.get('content'):
        return jsonify({'error': 'Données de message incomplètes.'}), 400

    message_id = MessageModel.create_message(payload)
    return jsonify({'message': 'Message envoyé.', 'message_id': message_id}), 201
