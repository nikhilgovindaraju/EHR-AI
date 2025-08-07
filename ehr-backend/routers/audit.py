# from fastapi import APIRouter, Depends, HTTPException, Query, Body
# from sqlalchemy.orm import Session
# from db.session import SessionLocal
# from models import tables, schemas
# import datetime
# from crypto.secure_log import encrypt_log
# from crypto.decrypt_log import decrypt_log
# from crypto.validate_chain import validate_log_chain
# from models.database import get_db
# from openai import OpenAI
# from dotenv import load_dotenv
# import os

# # ✅ Load env + initialize OpenAI client
# load_dotenv()
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# router = APIRouter()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.post("/add-log")
# def add_log(entry: schemas.AuditLogCreate, db: Session = Depends(get_db)):
#     crypto = encrypt_log(entry.dict())

#     new_log = tables.AuditLog(
#         user_id=entry.user_id,
#         patient_id=entry.patient_id,
#         patient_name=entry.patient_name,
#         age=entry.age,
#         diagnosis=entry.diagnosis,
#         medication=entry.medication,
#         notes=entry.data,
#         action=entry.action,
#         encrypted_data=crypto["encrypted_data"],
#         encrypted_aes_key=crypto["encrypted_aes_key"],
#         nonce=crypto["nonce"],
#         tag=crypto["tag"],
#         record_hash=crypto["record_hash"],
#             signature=crypto.get("signature", "N/A"),  # ✅ <--- THIS LINE
#             timestamp=datetime.datetime.utcnow()       # ✅ Fixed syntax error
#         )                                              # ✅ Added missing closing parenthesis
    


#     db.add(new_log)
#     db.commit()
#     return {"message": "Log securely encrypted and saved"}

# @router.get("/logs")
# def get_logs(user_id: str = Query(...), role: str = Query(...), db: Session = Depends(get_db)):
#     if role == "auditor":
#         logs = db.query(tables.AuditLog).all()
#     else:
#         logs = db.query(tables.AuditLog).filter(tables.AuditLog.user_id == user_id).all()

#     return {
#         "logs": [
#             {
#                 "id": log.id,
#                 "timestamp": log.timestamp.isoformat(),
#                 "user_id": log.user_id,
#                 "patient_id": log.patient_id,
#                 "patient_name": log.patient_name,
#                 "age": log.age,
#                 "diagnosis": log.diagnosis,
#                 "medication": log.medication,
#                 "notes": log.notes,
#                 "action": log.action
#             }
#             for log in logs
#         ]
#     }

# @router.get("/validate")
# def validate_chain(db: Session = Depends(get_db)):
#     logs = db.query(tables.AuditLog).all()
#     is_valid, broken_ids = validate_log_chain(logs)

#     if is_valid:
#         return {"message": "Audit chain is valid ✅"}
#     else:
#         return {
#             "message": "⚠️ Audit chain is broken",
#             "invalid_log_ids": broken_ids
#         }

# @router.post("/api/chatbot")
# async def chatbot_endpoint(req: ChatRequest):
#     try:
#         response = openai.ChatCompletion.create(
#             model="gpt-3.5-turbo",
#             messages=[{"role": "user", "content": req.message}]
#         )
#         reply = response.choices[0].message.content.strip()
#         return {"reply": reply}
#     except Exception as e:
#         return {"reply": "Error processing your request."}

# @router.put("/modify-log/{log_id}")
# def modify_log(log_id: int, updated: schemas.ModifyAuditLog, db: Session = Depends(get_db)):
#     log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
#     if not log:
#         raise HTTPException(status_code=404, detail="Log not found")

#     log.patient_name = updated.patient_name
#     log.age = updated.age
#     log.gender = updated.gender
#     log.diagnosis = updated.diagnosis
#     log.medication = updated.medication
#     log.notes = updated.notes
#     log.visit_date = updated.visit_date
#     log.vitals = updated.vitals
#     log.timestamp = datetime.datetime.utcnow()

#     db.commit()
#     return {"message": "Record updated successfully"}

# @router.delete("/delete-log/{log_id}")
# def delete_log(log_id: int, db: Session = Depends(get_db)):
#     log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
#     if not log:
#         raise HTTPException(status_code=404, detail="Log not found")
#     db.delete(log)
#     db.commit()
#     return {"message": "Record deleted successfully"}


from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.session import SessionLocal
from models import tables, schemas
import datetime
from crypto.secure_log import encrypt_log
from crypto.validate_chain import validate_log_chain
from models.database import get_db
from openai import OpenAI
from dotenv import load_dotenv
import os

from pydantic import BaseModel

# ✅ Load env + initialize OpenAI client
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------------
# ✅ ADD LOG
# ------------------------------
@router.post("/add-log")
def add_log(entry: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    crypto = encrypt_log(entry.dict())

    new_log = tables.AuditLog(
        user_id=entry.user_id,
        patient_id=entry.patient_id,
        patient_name=entry.patient_name,
        age=entry.age,
        diagnosis=entry.diagnosis,
        medication=entry.medication,
        notes=entry.data,
        action=entry.action,
        encrypted_data=crypto["encrypted_data"],
        encrypted_aes_key=crypto["encrypted_aes_key"],
        nonce=crypto["nonce"],
        tag=crypto["tag"],
        record_hash=crypto["record_hash"],
        signature=crypto.get("signature", "N/A"),
        timestamp=datetime.datetime.utcnow()
    )

    db.add(new_log)
    db.commit()
    return {"message": "Log securely encrypted and saved"}

# ------------------------------
# ✅ GET LOGS
# ------------------------------
@router.get("/logs")
def get_logs(user_id: str = Query(...), role: str = Query(...), db: Session = Depends(get_db)):
    if role == "auditor":
        logs = db.query(tables.AuditLog).all()
    else:
        logs = db.query(tables.AuditLog).filter(tables.AuditLog.user_id == user_id).all()

    return {
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "user_id": log.user_id,
                "patient_id": log.patient_id,
                "patient_name": log.patient_name,
                "age": log.age,
                "diagnosis": log.diagnosis,
                "medication": log.medication,
                "notes": log.notes,
                "action": log.action
            }
            for log in logs
        ]
    }

# ------------------------------
# ✅ VALIDATE CHAIN
# ------------------------------
@router.get("/validate")
def validate_chain(db: Session = Depends(get_db)):
    logs = db.query(tables.AuditLog).all()
    is_valid, broken_ids = validate_log_chain(logs)

    if is_valid:
        return {"message": "Audit chain is valid ✅"}
    else:
        return {"message": "⚠️ Audit chain is broken", "invalid_log_ids": broken_ids}

# ------------------------------
# ✅ CHATBOT ENDPOINT
# ------------------------------
class ChatRequest(BaseModel):
    message: str

@router.post("/chatbot")
async def chatbot_endpoint(req: ChatRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": req.message}]
        )
        reply = response.choices[0].message.content.strip()
        return {"reply": reply}
    except Exception as e:
        print("🔴 OpenAI Error:", e)  # <--- Add this line
        return {"reply": "Error processing your request."}


from sqlalchemy import text
from fastapi import Request

@router.post("/faq-query")
def faq_query(req: Request, db: Session = Depends(get_db)):
    import asyncio
    body = asyncio.run(req.json())
    question = body.get("question", "").lower().strip()

    try:
        if "how many patients" in question:
            result = db.execute(text("SELECT COUNT(DISTINCT patient_id) FROM audit_logs;")).scalar()
            return {"reply": f"There are {result} unique patients in the system."}

        elif "how many records" in question:
            result = db.execute(text("SELECT COUNT(*) FROM audit_logs;")).scalar()
            return {"reply": f"There are {result} audit records logged."}

        elif "most common diagnosis" in question:
            row = db.execute(text("""
                SELECT diagnosis, COUNT(*) AS count
                FROM audit_logs
                WHERE diagnosis IS NOT NULL AND diagnosis != ''
                GROUP BY diagnosis
                ORDER BY count DESC
                LIMIT 1;
            """)).fetchone()
            return {"reply": f"The most common diagnosis is '{row[0]}' with {row[1]} entries."}

        elif "recent visits" in question:
            rows = db.execute(text("""
                SELECT patient_id, patient_name, visit_date
                FROM audit_logs
                WHERE visit_date IS NOT NULL
                ORDER BY visit_date DESC
                LIMIT 5;
            """)).fetchall()
            reply = "\n".join([f"{r[1]} (ID: {r[0]}) visited on {r[2]}" for r in rows])
            return {"reply": f"Recent visits:\n{reply}"}

        elif "patient summary" in question:
            pid = body.get("patient_id", "")
            row = db.execute(text(f"""
                SELECT patient_id, patient_name, age, gender, diagnosis, medication, visit_date, vitals, notes
                FROM audit_logs
                WHERE patient_id = '{pid}'
                ORDER BY timestamp DESC
                LIMIT 1;
            """)).fetchone()
            if not row:
                return {"reply": f"No records found for patient ID '{pid}'."}
            return {
                "reply": f"""
Patient ID: {row[0]}
Name: {row[1]}
Age/Gender: {row[2]}/{row[3]}
Diagnosis: {row[4]}
Medication: {row[5]}
Visit Date: {row[6]}
Vitals: {row[7]}
Notes: {row[8]}
"""
            }

        return {"reply": "❓ Sorry, I couldn't understand the question."}

    except Exception as e:
        print("FAQ error:", e)
        return {"reply": "⚠️ Failed to process the FAQ query."}


# ------------------------------
# ✅ MODIFY LOG
# ------------------------------
@router.put("/modify-log/{log_id}")
def modify_log(log_id: int, updated: schemas.ModifyAuditLog, db: Session = Depends(get_db)):
    log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    log.patient_name = updated.patient_name
    log.age = updated.age
    log.gender = updated.gender
    log.diagnosis = updated.diagnosis
    log.medication = updated.medication
    log.notes = updated.notes
    log.visit_date = updated.visit_date
    log.vitals = updated.vitals
    log.timestamp = datetime.datetime.utcnow()

    db.commit()
    return {"message": "Record updated successfully"}

# ------------------------------
# ✅ DELETE LOG
# ------------------------------
@router.delete("/delete-log/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"message": "Record deleted successfully"}
