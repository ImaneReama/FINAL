from app.models.offer_model import OfferModel
from flask import request, jsonify


def create_offer():
    payload = request.get_json() or {}
    if not payload.get('demande_id') or not payload.get('mecanicien_id') or payload.get('price') is None:
        return jsonify({'error': 'Données de l’offre incomplètes.'}), 400

    offer_id = OfferModel.create_offer(payload)
    return jsonify({'message': 'Offre créée avec succès.', 'offer_id': offer_id}), 201
