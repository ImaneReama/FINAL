from app.models.intervention_model import InterventionModel
from flask import request, jsonify


def create_intervention():
    payload = request.get_json() or {}
    if not payload.get('demande_id') or not payload.get('mecanicien_id'):
        return jsonify({'error': 'Données d’intervention incomplètes.'}), 400

    intervention_id = InterventionModel.create_intervention(payload)
    return jsonify({'message': 'Intervention enregistrée.', 'intervention_id': intervention_id}), 201
