from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import bcrypt
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_password(self, password):
        """Hash password exactly once using bcrypt"""
        if isinstance(password, str):
            password = password.encode('utf-8')
        self.hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        """Verify password against hash"""
        if isinstance(password, str):
            password = password.encode('utf-8')
        if isinstance(self.hashed_password, str):
            stored_hash = self.hashed_password.encode('utf-8')
        else:
            stored_hash = self.hashed_password
        return bcrypt.checkpw(password, stored_hash)
