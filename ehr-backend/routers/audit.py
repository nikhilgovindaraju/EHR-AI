from fastapi import APIRouter, Depends, HTTPException, Query, Request
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
from sqlalchemy import text, func 
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

@router.get("/logs")
def get_logs(
    role: str = Query(..., description="doctor|patient|auditor"),
    user_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(tables.AuditLog).order_by(tables.AuditLog.timestamp.desc())

    if role == "auditor":
        pass  
    elif role == "doctor":
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required for doctor role")
        q = q.filter(tables.AuditLog.user_id == user_id)
    elif role == "patient":
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
        elif patient_name:
            q = q.filter(func.lower(tables.AuditLog.patient_name) == func.lower(patient_name))
        else:
            raise HTTPException(status_code=400, detail="patient_id or patient_name required for patient role")
    else:
        raise HTTPException(status_code=400, detail="invalid role")

    logs = q.all()
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
                "action": log.action,
            }
            for log in logs
        ]
    }

@router.get("/validate")
def validate_chain(db: Session = Depends(get_db)):
    logs = db.query(tables.AuditLog).all()
    is_valid, broken_ids = validate_log_chain(logs)

    if is_valid:
        return {"message": "Audit chain is valid ✅"}
    else:
        return {"message": "⚠️ Audit chain is broken", "invalid_log_ids": broken_ids}
class ChatRequest(BaseModel):
    message: str

class ChatReq(BaseModel):
    user_id: str
    role: str                
    question: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    limit: int = 20

def _fetch_recent_logs(db: Session, user_id: str, role: str,
                       patient_id: Optional[str], patient_name: Optional[str],
                       limit: int = 20):
    q = db.query(tables.AuditLog).order_by(tables.AuditLog.timestamp.desc())
    role = (role or "").lower()

    if role == "doctor":
        q = q.filter(tables.AuditLog.user_id == user_id)
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
        elif patient_name:
            q = q.filter(func.lower(tables.AuditLog.patient_name) == func.lower(patient_name))

    elif role == "patient":
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
        elif patient_name:
            q = q.filter(func.lower(tables.AuditLog.patient_name) == func.lower(patient_name))
        else:
            q = q.filter(
                (tables.AuditLog.patient_id == user_id) |
                (func.lower(tables.AuditLog.patient_name) == func.lower(user_id))
            )

    return q.limit(min(max(limit, 1), 50)).all()


def _rows_to_context(rows):
    if not rows:
        return "No relevant records."
    lines = []
    for r in rows:
        lines.append(
            f"[{r.timestamp}] patient_id={r.patient_id} name={r.patient_name or '-'} "
            f"age={r.age or '-'} dx={r.diagnosis or '-'} med={r.medication or '-'} "
            f"notes={r.notes or '-'} action={r.action or '-'}"
        )
    return "\n".join(lines)

def _quick_stats(rows):
    from collections import Counter
    dx = Counter([(r.diagnosis or "").strip().lower() for r in rows if (r.diagnosis or "").strip()])
    meds = Counter([(r.medication or "").strip().lower() for r in rows if (r.medication or "").strip()])
    return {
        "total_logs": len(rows),
        "top_diagnoses": dx.most_common(5),
        "top_medications": meds.most_common(5),
        "last_visit": str(rows[0].timestamp) if rows else None,
    }

@router.post("/chat")
def chat(req: ChatReq, db: Session = Depends(get_db)):
    rows = _fetch_recent_logs(db, req.user_id, req.role, req.patient_id, req.patient_name, req.limit)

    def row_to_dict(r):
        return {
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "patient_id": r.patient_id,
            "patient_name": r.patient_name,
            "age": r.age,
            "diagnosis": r.diagnosis,
            "medication": r.medication,
            "notes": r.notes,
            "action": r.action,
            "doctor_id": r.user_id,
        }
    rows_json = [row_to_dict(r) for r in rows]

    from collections import Counter
    dx = Counter([(r.diagnosis or "").strip().lower() for r in rows if (r.diagnosis or "").strip()])
    meds = Counter([(r.medication or "").strip().lower() for r in rows if (r.medication or "").strip()])
    stats = {
        "total_logs": len(rows),
        "top_diagnoses": dx.most_common(5),
        "top_medications": meds.most_common(5),
        "last_visit": rows[0].timestamp.isoformat() if rows else None,
    }

    def rows_to_context(rs):
        if not rs:
            return "No relevant records."
        lines = []
        for r in rs:
            lines.append(
                f"[{r.timestamp}] pid={r.patient_id} name={r.patient_name or '-'} "
                f"age={r.age or '-'} dx={r.diagnosis or '-'} "
                f"med={r.medication or '-'} notes={r.notes or '-'} action={r.action or '-'}"
            )
        return "\n".join(lines)

    context = rows_to_context(rows)

    if client:
        system = (
            "You are a clinical assistant. Use ONLY the context provided. "
            "If information is missing, say so briefly. Do not invent diagnoses or treatment."
        )
        user_prompt = (
            f"Question: {req.question}\n\n"
            f"Recent records (most recent first):\n{context}\n\n"
            f"Quick stats: total_logs={stats['total_logs']}, "
            f"top_diagnoses={stats['top_diagnoses']}, "
            f"top_meds={stats['top_medications']}, "
            f"last_visit={stats['last_visit']}.\n\n"
            f"Answer concisely. Use short bullet points when listing."
        )
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            return {"answer": resp.choices[0].message.content, "stats": stats, "rows": rows_json}
        except Exception as e:
            print("OpenAI error:", e)

    q = (req.question or "").strip().lower()
    answer_lines = []

    if not rows:
        return {"answer": "I couldn’t find any records for this patient.", "stats": stats, "rows": rows_json}

    if "medication" in q or "medications" in q:
        uniq = []
        seen = set()
        for r in rows:
            m = (r.medication or "").strip()
            if m and m.lower() not in seen:
                uniq.append(m)
                seen.add(m.lower())
        answer_lines.append("Medications mentioned (most recent first):")
        answer_lines += [f"• {m}" for m in uniq] if uniq else ["• None recorded."]

    elif "last visit" in q or "recent visit" in q:
        r = rows[0]
        answer_lines.append("Last visit:")
        answer_lines.append(f"• When: {r.timestamp.isoformat()}")
        answer_lines.append(f"• Diagnosis: {r.diagnosis or '—'}")
        answer_lines.append(f"• Medication: {r.medication or '—'}")
        answer_lines.append(f"• Notes: {(r.notes or '—')[:200]}")

    elif "who is my doctor" in q or "my doctor" in q or "doctor" in q:
        docs = []
        seen = set()
        for r in rows:
            if r.user_id and r.user_id not in seen:
                docs.append(r.user_id)
                seen.add(r.user_id)
        if docs:
            answer_lines.append("Your doctor(s) on record:")
            answer_lines += [f"• {d}" for d in docs]
        else:
            answer_lines.append("I couldn’t find any doctor on record for these entries.")

    elif "diagnos" in q: 
        if stats["top_diagnoses"]:
            answer_lines.append("Common diagnoses:")
            answer_lines += [f"• {d} ({c})" for d, c in stats["top_diagnoses"]]
        else:
            answer_lines.append("No diagnoses found in recent records.")

    elif "summary" in q:
        take = rows[:3]
        answer_lines.append("Recent visits summary:")
        for r in take:
            answer_lines.append(
                f"• {r.timestamp.date() if r.timestamp else ''}: "
                f"dx={r.diagnosis or '—'}, med={r.medication or '—'}, notes={(r.notes or '—')[:120]}"
            )

    else:
        answer_lines.append(f"Total logs: {stats['total_logs']}")
        if stats["top_diagnoses"]:
            answer_lines.append("Top diagnoses: " + ", ".join([f"{d} ({c})" for d, c in stats["top_diagnoses"]]))
        if stats["top_medications"]:
            answer_lines.append("Top medications: " + ", ".join([f"{m} ({c})" for m, c in stats["top_medications"]]))
        if stats["last_visit"]:
            answer_lines.append(f"Last visit: {stats['last_visit']}")

    return {"answer": "\n".join(answer_lines), "stats": stats, "rows": rows_json}



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

@router.delete("/delete-log/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"message": "Record deleted successfully"}
