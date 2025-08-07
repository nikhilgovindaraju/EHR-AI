from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import SessionLocal
from models import tables, schemas
from passlib.context import CryptContext
from crypto.secure_log import encrypt_log
from fastapi import Query
from crypto.decrypt_log import decrypt_log
from models.database import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: schemas.RegisterUser, db: Session = Depends(get_db)):
    hashed_pw = pwd_context.hash(user.password)
    new_user = tables.User(user_id=user.user_id, password=hashed_pw, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: schemas.LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(tables.User).filter(tables.User.user_id == user.user_id).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "role": db_user.role}

@router.post("/add-log")
def add_log(entry: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    encrypted_data, signature, record_hash = encrypt_log(entry.dict())

    new_log = tables.AuditLog(
        user_id=entry.user_id,
        patient_id=entry.patient_id,
        action=entry.action,
        encrypted_data=encrypted_data.encode(),
        signature=signature,
        record_hash=record_hash,
    )
    db.add(new_log)
    db.commit()
    return {"message": "Log added securely"}

@router.get("/logs")
def get_logs(user_id: str = Query(...), role: str = Query(...), db: Session = Depends(get_db)):
    if role == "patient":
        logs = db.query(tables.AuditLog).filter(tables.AuditLog.patient_id == user_id).all()
    elif role == "auditor":
        logs = db.query(tables.AuditLog).all()
    else:
        logs = db.query(tables.AuditLog).filter(tables.AuditLog.user_id == user_id).all()

    decrypted_logs = []
    for log in logs:
        try:
            decrypted_entry = decrypt_log(
                encrypted_data_b64=log.encrypted_data.decode(),
                encrypted_key_path=f"private_keys/{user_id}.pem",  # Load correct private key
                nonce_b64=log.signature,  # Used signature slot for nonce temporarily
                tag_b64=log.signature     # Replace with real tag if stored separately
            )
            decrypted_logs.append({
                "user_id": log.user_id,
                "patient_id": log.patient_id,
                "action": log.action,
                "decrypted": decrypted_entry,
                "timestamp": log.timestamp,
                "hash": log.record_hash
            })
        except Exception as e:
            decrypted_logs.append({
                "error": f"Failed to decrypt log: {str(e)}",
                "log_id": log.id
            })

    return decrypted_logs