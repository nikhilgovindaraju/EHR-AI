from sqlalchemy import Column, String, Integer, DateTime, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)                   
    patient_id = Column(String)                
    patient_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    diagnosis = Column(String, nullable=True)
    medication = Column(String, nullable=True)
    notes = Column(String, nullable=True)       

    action = Column(String)                  
    encrypted_data = Column(LargeBinary)
    encrypted_aes_key = Column(LargeBinary)
    nonce = Column(String)
    tag = Column(String)
    signature = Column(String)
    record_hash = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    gender = Column(String, nullable=True)
    visit_date = Column(String, nullable=True)
    vitals = Column(String, nullable=True)




