import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models.database import init_db, get_db
from models.tables import User
from models.schemas import RegisterUser, LoginUser
from utils.crypto import verify_password, hash_password
from crypto.generate_keys import generate_keys
from routers import audit
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Secure EHR API", version="1.0.0")

_base_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://nikhilgovindaraju.github.io",
]
_frontend_url = os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = list({*_base_origins, *([_frontend_url] if _frontend_url else [])})

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(audit.router, prefix="/api/audit")


@app.get("/")
def index():
    return {"message": "Secure EHR API is running."}


@app.post("/api/register")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.user_id == user.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User ID already taken")

    hashed_pw = hash_password(user.password)
    new_user = User(user_id=user.user_id, password=hashed_pw, role=user.role)
    db.add(new_user)
    db.commit()

    # Generate RSA keys for every user — patients are encryption recipients too
    generate_keys(user.user_id)

    return {"message": f"User {user.user_id} registered successfully."}


@app.post("/api/login")
def login_user(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        User.user_id == user.user_id,
        User.role == user.role
    ).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials or role mismatch")

    # Frontend checks res.data.user_id to confirm login — must return it
    return {
        "message": "Login successful",
        "user_id": db_user.user_id,
        "role": db_user.role,
    }