from app.models.request_model import RequestModel
from flask import request, jsonify


def create_request():
    payload = request.get_json() or {}
    if not payload.get('client_id') or not payload.get('category'):
        return jsonify({'error': 'Données de demande incomplètes.'}), 400

    request_id = RequestModel.create_request(payload)
    return jsonify({'message': 'Demande créée avec succès.', 'request_id': request_id}), 201
