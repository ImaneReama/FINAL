from app.models.location_model import LocationModel
from flask import request, jsonify


def save_location():
    payload = request.get_json() or {}
    if not payload.get('user_id') or payload.get('latitude') is None or payload.get('longitude') is None:
        return jsonify({'error': 'Données de géolocalisation incomplètes.'}), 400

    location_id = LocationModel.save_location(payload)
    return jsonify({'message': 'Position sauvegardée.', 'location_id': location_id}), 201
from app.models.location_model import LocationModel
from flask import request, jsonify


def save_location():
    payload = request.get_json() or {}
    if not payload.get('user_id') or payload.get('latitude') is None or payload.get('longitude') is None:
        return jsonify({'error': 'Coordonnées de localisation incomplètes.'}), 400

    location_id = LocationModel.save_location(payload)
    return jsonify({'message': 'Localisation enregistrée.', 'location_id': location_id}), 201
