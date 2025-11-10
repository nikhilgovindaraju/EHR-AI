from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models.database import init_db, get_db
from models.tables import User, AuditLog
from utils.crypto import verify_password, hash_password, encrypt_data, generate_signature, compute_hash
from models.schemas import RegisterUser, LoginUser, AuditLogCreate
from crypto.generate_keys import generate_keys  
from routers import audit  
import base64, datetime
import os

app = FastAPI()

# @app.get("/api/health")
# def health():
#     return {"status": "ok"}



FRONTEND_URL = "http://localhost:3000"

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,         # required if axios uses withCredentials
    allow_methods=["*"],            # or list: ["GET","POST","PUT","DELETE","OPTIONS"]
    allow_headers=["*"],            # include custom headers like Authorization
)

init_db()
app.include_router(audit.router, prefix="/api/audit")

@app.get("/")
def index():
    return {"message": "Secure EHR API is running."}

@app.post("/api/register")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    hashed_pw = hash_password(user.password)
    new_user = User(user_id=user.user_id, password=hashed_pw, role=user.role)
    db.add(new_user)
    db.commit()

    generate_keys(user.user_id)  

    return {"message": f"User {user.user_id} registered successfully."}

@app.post("/api/login")
def login_user(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.user_id == user.user_id, User.role == user.role).first()
    if not db_user or not verify_password(user.password, db_user.password):
        return {"error": "Invalid credentials"}
    return {"message": "Login successful", "user_id": db_user.user_id, "role": db_user.role}
