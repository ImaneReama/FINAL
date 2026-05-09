from flask import request, jsonify
from app.models.user_model import User, Base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
import os
import jwt
from datetime import datetime, timedelta

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./wqaft.db')
engine = create_engine(DB_URL)
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)

JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key')

def register():
    """Register a new user with validation and duplicate checks"""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', '').strip()

    if not name or not password or not role:
        return jsonify({'error': 'Nom, mot de passe et rôle requis.'}), 400

    if not email and not phone:
        return jsonify({'error': 'Veuillez indiquer un email ou un numéro de téléphone.'}), 400

    session = Session()
    try:
        # Check if email already exists
        if email:
            existing_email = session.query(User).filter(User.email == email).first()
            if existing_email:
                session.close()
                return jsonify({'error': 'Cet email est déjà associé à un compte. Connectez-vous.'}), 400

        # Check if phone already exists
        if phone:
            existing_phone = session.query(User).filter(User.phone == phone).first()
            if existing_phone:
                session.close()
                return jsonify({'error': 'Ce numéro de téléphone est déjà associé à un compte.'}), 400

        # Create new user
        new_user = User(
            name=name,
            email=email,
            phone=phone,
            role=role
        )
        
        # Hash password exactly once
        new_user.set_password(password)
        
        # Add to database
        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        # Generate JWT token
        token = jwt.encode({
            'user_id': new_user.id,
            'email': new_user.email,
            'role': new_user.role,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')

        session.close()
        return jsonify({
            'message': 'Compte créé avec succès.',
            'user': {
                'id': new_user.id,
                'name': new_user.name,
                'email': new_user.email,
                'role': new_user.role
            },
            'token': token
        }), 201

    except IntegrityError as e:
        session.rollback()
        session.close()
        error_msg = str(e).lower()
        if 'email' in error_msg and 'unique' in error_msg:
            return jsonify({'error': 'Cet email est déjà associé à un compte. Connectez-vous.'}), 400
        elif 'phone' in error_msg and 'unique' in error_msg:
            return jsonify({'error': 'Ce numéro de téléphone est déjà associé à un compte.'}), 400
        else:
            return jsonify({'error': 'Une erreur est survenue lors de la création du compte. Veuillez réessayer.'}), 409
    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({'error': 'Erreur interne du serveur.'}), 500

def login():
    """Login user with email or phone"""
    data = request.get_json() or {}
    identifier = data.get('identifier', '').strip()
    password = data.get('password', '').strip()

    if not identifier or not password:
        return jsonify({'error': 'Email ou téléphone et mot de passe requis.'}), 400

    session = Session()
    try:
        user = session.query(User).filter(
            (User.email == identifier) | (User.phone == identifier)
        ).first()

        if not user or not user.check_password(password):
            session.close()
            return jsonify({'error': 'Email, téléphone ou mot de passe incorrect.'}), 401

        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')

        session.close()
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }), 200

    except Exception as e:
        session.close()
        return jsonify({'error': 'Erreur interne du serveur.'}), 500
