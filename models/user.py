from sqlalchemy import Column, Integer, String, Boolean, Float, Text
from sqlalchemy.ext.declarative import declarative_base
import bcrypt

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    city = Column(String(255), nullable=True)
    avatar = Column(String(255), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    mecanicien_type = Column(String(50), nullable=True)
    specialties = Column(Text, nullable=True)
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    approved = Column(Boolean, default=False)

    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
