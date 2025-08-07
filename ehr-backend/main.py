# from fastapi import FastAPI, Request, Form, Depends
# from fastapi.responses import RedirectResponse
# from sqlalchemy.orm import Session

# from routers import auth, audit  # ✅ This must come BEFORE usage
# from models.database import init_db, get_db
# from models.tables import User, AuditLog
# from utils.crypto import verify_password, hash_password, encrypt_data, generate_signature, compute_hash
# import base64, datetime

# from fastapi.middleware.cors import CORSMiddleware
# from fastapi import HTTPException

# from models.schemas import RegisterUser, LoginUser
# from models.schemas import AuditLogCreate


# app = FastAPI()


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # 👈 must be explicit
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ✅ Initialize DB and Routers
# init_db()
# app.include_router(auth.router, prefix="/api/auth")
# app.include_router(audit.router, prefix="/api/audit")

# @app.get("/")
# def index():
#     return {"message": "Secure EHR API is running."}

# @app.post("/register")
# def register_user(user: RegisterUser, db: Session = Depends(get_db)):
#     hashed_pw = hash_password(user.password)
#     new_user = User(user_id=user.user_id, password=hashed_pw, role=user.role)
#     db.add(new_user)
#     db.commit()
#     return {"message": f"User {user.user_id} registered successfully."}

# @app.post("/login")
# def login_user(user: LoginUser, db: Session = Depends(get_db)):
#     db_user = db.query(User).filter(User.user_id == user.user_id, User.role == user.role).first()
#     if not db_user or not verify_password(user.password, db_user.password):
#         return {"error": "Invalid credentials"}
#     return {"message": "Login successful", "user_id": db_user.user_id, "role": db_user.role}

# # ✅ View all audit logs
# @app.get("/logs")
# def view_logs(db: Session = Depends(get_db)):
#     logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
#     return {"logs": [
#         {
#             "user_id": log.user_id,
#             "patient_id": log.patient_id,
#             "action": log.action,
#             "timestamp": log.timestamp,
#             "signature": log.signature,
#             "record_hash": log.record_hash
#         } for log in logs
#     ]}

# # ✅ Add a new audit log
# @app.post("/add-log")
# def save_log(payload: AuditLogCreate, db: Session = Depends(get_db)):
#     user_id = payload.user_id
#     patient_id = payload.patient_id
#     action = payload.action
#     data = payload.data

#     # Fetch existing record for the patient if exists
#     existing = db.query(AuditLog).filter(
#         AuditLog.user_id == user_id,
#         AuditLog.patient_id == patient_id
#     ).order_by(AuditLog.timestamp.desc()).first()

#     # --- ACTION HANDLING ---
#     if action.lower() == "create":
#         if existing:
#             raise HTTPException(status_code=400, detail="Record already exists. Use 'change' instead.")
#         message = f"Record created for {patient_id}"

#     elif action.lower() == "change":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to change.")
#         message = f"Record updated for {patient_id}"

#     elif action.lower() == "query":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record found.")
#         return {
#             "message": f"Record fetched for {payload.patient_id}",
#             "record": base64.b64encode(existing.encrypted_data).decode()
#         }

#     elif action.lower() == "print":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to print.")
#         return {
#             "message": f"Printing record for {payload.patient_id}",
#             "record": base64.b64encode(existing.encrypted_data).decode()
#         }


#     elif action.lower() == "copy":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to copy.")
#         message = f"Record copied for {patient_id}"

#     elif action.lower() == "delete":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to delete.")
#         db.delete(existing)
#         db.commit()
#         return {"message": f"Record deleted for {patient_id}"}

#     else:
#         raise HTTPException(status_code=400, detail="Invalid action.")

#     # --- Logging securely ---
#     encrypted_data, aes_key, nonce, tag = encrypt_data(data, user_id)
#     record_hash = compute_hash(data)
#     signature = generate_signature(data, user_id)

#     new_log = AuditLog(
#         user_id=user_id,
#         patient_id=patient_id,
#         action=action,
#         encrypted_data=encrypted_data,
#         encrypted_aes_key=aes_key,
#         nonce=base64.b64encode(nonce).decode(),
#         tag=base64.b64encode(tag).decode(),
#         signature=signature,
#         record_hash=record_hash,
#         timestamp=datetime.datetime.utcnow()
#     )

#     db.add(new_log)
#     db.commit()
#     return {"message": f"✅ {message} and logged successfully."}


from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models.database import init_db, get_db
from models.tables import User, AuditLog
from utils.crypto import verify_password, hash_password, encrypt_data, generate_signature, compute_hash
from models.schemas import RegisterUser, LoginUser, AuditLogCreate
from crypto.generate_keys import generate_keys  # ✅ Import for automatic key generation

from routers import audit  # 👈 make sure you import the audit router



import base64, datetime

app = FastAPI()

# ✅ Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Initialize DB and include routers
init_db()
app.include_router(audit.router, prefix="/api/audit")

@app.get("/")
def index():
    return {"message": "Secure EHR API is running."}

@app.post("/register")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    hashed_pw = hash_password(user.password)
    new_user = User(user_id=user.user_id, password=hashed_pw, role=user.role)
    db.add(new_user)
    db.commit()

    generate_keys(user.user_id)  # ✅ Automatically generate keys

    return {"message": f"User {user.user_id} registered successfully."}

@app.post("/login")
def login_user(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.user_id == user.user_id, User.role == user.role).first()
    if not db_user or not verify_password(user.password, db_user.password):
        return {"error": "Invalid credentials"}
    return {"message": "Login successful", "user_id": db_user.user_id, "role": db_user.role}



# @app.get("/logs")
# def view_logs(db: Session = Depends(get_db)):
#     logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
#     return {"logs": [
#         {
#             "user_id": log.user_id,
#             "patient_id": log.patient_id,
#             "action": log.action,
#             "timestamp": log.timestamp,
#             "signature": log.signature,
#             "record_hash": log.record_hash
#         } for log in logs
#     ]}

# @app.post("/add-log")
# def save_log(payload: AuditLogCreate, db: Session = Depends(get_db)):
#     user_id = payload.user_id
#     patient_id = payload.patient_id
#     action = payload.action
#     data = payload.data

#     existing = db.query(AuditLog).filter(
#         AuditLog.user_id == user_id,
#         AuditLog.patient_id == patient_id
#     ).order_by(AuditLog.timestamp.desc()).first()

#     if action.lower() == "create":
#         if existing:
#             raise HTTPException(status_code=400, detail="Record already exists. Use 'change' instead.")
#         message = f"Record created for {patient_id}"

#     elif action.lower() == "change":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to change.")
#         message = f"Record updated for {patient_id}"

#     elif action.lower() in {"query", "print"}:
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record found.")
#         return {
#             "message": f"Record retrieved for {patient_id}",
#             "record": base64.b64encode(existing.encrypted_data).decode()
#         }

#     elif action.lower() == "copy":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to copy.")
#         message = f"Record copied for {patient_id}"

#     elif action.lower() == "delete":
#         if not existing:
#             raise HTTPException(status_code=404, detail="No record to delete.")
#         db.delete(existing)
#         db.commit()
#         return {"message": f"Record deleted for {patient_id}"}

#     else:
#         raise HTTPException(status_code=400, detail="Invalid action.")

#     encrypted_data, aes_key, nonce, tag = encrypt_data(data, user_id)
#     record_hash = compute_hash(data)
#     signature = generate_signature(data, user_id)

#     new_log = AuditLog(
#         user_id=user_id,
#         patient_id=patient_id,
#         action=action,
#         encrypted_data=encrypted_data,
#         encrypted_aes_key=aes_key,
#         nonce=base64.b64encode(nonce).decode(),
#         tag=base64.b64encode(tag).decode(),
#         signature=signature,
#         record_hash=record_hash,
#         timestamp=datetime.datetime.utcnow()
#     )

#     db.add(new_log)
#     db.commit()
#     return {"message": f"✅ {message} and logged successfully."}
