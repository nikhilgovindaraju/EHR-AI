from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import tables, schemas
from models.database import get_db       # single source of truth — no local get_db()
import hashlib
from crypto.secure_log import encrypt_log
from crypto.validate_chain import validate_log_chain, _chain_hash
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional
from collections import Counter
import datetime
import os

from dotenv import load_dotenv
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None

router = APIRouter()


# ─── Add Log ─────────────────────────────────────────────────────────────────

@router.post("/add-log")
def add_log(entry: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    crypto = encrypt_log(entry.dict())

    # Fetch the current tail of the chain so we can link to it
    prev_log = (
        db.query(tables.AuditLog)
        .order_by(tables.AuditLog.timestamp.desc(), tables.AuditLog.id.desc())
        .first()
    )

    new_log = tables.AuditLog(
        user_id=entry.user_id,
        patient_id=entry.patient_id,
        patient_name=entry.patient_name,
        age=entry.age,
        gender=entry.gender,
        diagnosis=entry.diagnosis,
        medication=entry.medication,
        notes=entry.data,
        visit_date=entry.visit_date,
        vitals=entry.vitals,
        action=entry.action,
        encrypted_data=crypto["encrypted_data"],
        encrypted_aes_key=crypto["encrypted_aes_key"],
        nonce=crypto["nonce"],
        tag=crypto["tag"],
        # Genesis record gets a fixed sentinel hash; every other record stores
        # the chain-hash of its predecessor so validate_log_chain passes.
        record_hash=(
            hashlib.sha256(b"GENESIS").hexdigest()
            if prev_log is None
            else _chain_hash(prev_log)
        ),
        signature=crypto.get("signature", "N/A"),
        timestamp=datetime.datetime.utcnow(),
    )
    db.add(new_log)
    db.commit()
    return {"message": "Log securely encrypted and saved"}


# ─── Get Logs ─────────────────────────────────────────────────────────────────

@router.get("/logs")
def get_logs(
    role: str = Query(..., description="doctor | patient | auditor"),
    user_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(tables.AuditLog).order_by(tables.AuditLog.timestamp.desc())
    role = role.lower()

    if role == "auditor":
        pass  # sees everything
    elif role == "doctor":
        if not user_id:
            raise HTTPException(400, "user_id required for doctor role")
        q = q.filter(tables.AuditLog.user_id == user_id)
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
    elif role == "patient":
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
        elif patient_name:
            q = q.filter(
                func.lower(tables.AuditLog.patient_name) == patient_name.lower()
            )
        elif user_id:
            # Patient logged in: match their user_id against both patient_id
            # and patient_name so records created under either field are visible.
            q = q.filter(
                (tables.AuditLog.patient_id == user_id)
                | (func.lower(tables.AuditLog.patient_name) == user_id.lower())
            )
        else:
            raise HTTPException(400, "patient_id, patient_name, or user_id required for patient role")
    else:
        raise HTTPException(400, "Invalid role")

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
                "gender": log.gender,
                "diagnosis": log.diagnosis,
                "medication": log.medication,
                "notes": log.notes,
                "visit_date": log.visit_date,
                "vitals": log.vitals,
                "action": log.action,
            }
            for log in logs
        ]
    }


# ─── Validate Chain ───────────────────────────────────────────────────────────

@router.get("/validate")
def validate_chain(db: Session = Depends(get_db)):
    logs = db.query(tables.AuditLog).order_by(tables.AuditLog.timestamp).all()
    is_valid, broken_ids = validate_log_chain(logs)
    if is_valid:
        return {"status": "valid", "message": "Audit chain is valid", "total_records": len(logs)}
    return {
        "status": "broken",
        "message": "Audit chain integrity broken",
        "invalid_log_ids": broken_ids,
        "total_records": len(logs),
    }


# ─── Rebuild chain ────────────────────────────────────────────────────────────

@router.post("/rechain")
def rechain(db: Session = Depends(get_db)):
    """
    Rebuild the SHA-256 hash chain for every record in chronological order.
    Call this once to fix chains that were written before the correct chaining
    logic was in place, or after any manual database migration.
    """
    logs = (
        db.query(tables.AuditLog)
        .order_by(tables.AuditLog.timestamp, tables.AuditLog.id)
        .all()
    )
    if not logs:
        return {"message": "No records found — nothing to rechain.", "rechained": 0}

    # Genesis record gets a fixed sentinel
    logs[0].record_hash = hashlib.sha256(b"GENESIS").hexdigest()

    # Each subsequent record stores the chain-hash of its predecessor
    for i in range(1, len(logs)):
        logs[i].record_hash = _chain_hash(logs[i - 1])

    db.commit()
    return {
        "message": f"Chain rebuilt successfully across {len(logs)} record(s).",
        "rechained": len(logs),
    }


# ─── Modify / Delete ──────────────────────────────────────────────────────────

@router.put("/modify-log/{log_id}")
def modify_log(
    log_id: int, updated: schemas.ModifyAuditLog, db: Session = Depends(get_db)
):
    log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Log not found")

    # Only update fields that were explicitly sent
    for field, value in updated.dict(exclude_unset=True).items():
        setattr(log, field, value)

    log.timestamp = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Record updated successfully"}


@router.delete("/delete-log/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(tables.AuditLog).filter(tables.AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Log not found")
    db.delete(log)
    db.commit()
    return {"message": "Record deleted successfully"}


# ─── Chatbot helpers ──────────────────────────────────────────────────────────

class ChatReq(BaseModel):
    user_id: str
    role: str
    question: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    limit: int = 20


def _fetch_logs(db, user_id, role, patient_id, patient_name, limit):
    q = db.query(tables.AuditLog).order_by(tables.AuditLog.timestamp.desc())
    role = (role or "").lower()

    if role == "doctor":
        q = q.filter(tables.AuditLog.user_id == user_id)
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
        elif patient_name:
            q = q.filter(
                func.lower(tables.AuditLog.patient_name) == patient_name.lower()
            )
    elif role == "patient":
        if patient_id:
            q = q.filter(tables.AuditLog.patient_id == patient_id)
        elif patient_name:
            q = q.filter(
                func.lower(tables.AuditLog.patient_name) == patient_name.lower()
            )
        else:
            q = q.filter(
                (tables.AuditLog.patient_id == user_id)
                | (func.lower(tables.AuditLog.patient_name) == user_id.lower())
            )

    return q.limit(min(max(limit, 1), 50)).all()


def _build_stats(rows):
    dx = Counter(
        [(r.diagnosis or "").strip().lower() for r in rows if (r.diagnosis or "").strip()]
    )
    meds = Counter(
        [(r.medication or "").strip().lower() for r in rows if (r.medication or "").strip()]
    )
    return {
        "total_logs": len(rows),
        "top_diagnoses": dx.most_common(5),
        "top_medications": meds.most_common(5),
        "last_visit": rows[0].timestamp.isoformat() if rows else None,
    }


def _fmt_date(ts):
    """Return a readable date string from a datetime object."""
    if not ts:
        return "unknown date"
    try:
        return ts.strftime("%B %d, %Y")
    except Exception:
        return str(ts)


def _rows_to_context(rows):
    if not rows:
        return "No relevant records found in the system."
    parts = []
    for i, r in enumerate(rows, 1):
        name = r.patient_name or "unknown patient"
        pid  = r.patient_id   or "?"
        date = _fmt_date(r.timestamp)
        dx   = r.diagnosis    or None
        med  = r.medication   or None
        notes = r.notes       or None
        age  = f", age {r.age}" if r.age else ""
        gender = f", {r.gender}" if r.gender else ""
        visit  = f", visit date {r.visit_date}" if r.visit_date else ""
        vitals = f", vitals: {r.vitals}" if r.vitals else ""
        line = f"Record {i} — {date}: {name} (ID {pid}{age}{gender})"
        if dx:    line += f", diagnosed with {dx}"
        if med:   line += f", prescribed {med}"
        if vitals: line += vitals
        if visit: line += visit
        if notes: line += f". Notes: {notes[:200]}"
        line += f". Action: {r.action or 'CREATE'}."
        parts.append(line)
    return "\n".join(parts)


def _row_to_dict(r):
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


# ─── Chatbot endpoint ─────────────────────────────────────────────────────────

@router.post("/chat")
def chat(req: ChatReq, db: Session = Depends(get_db)):
    rows = _fetch_logs(
        db, req.user_id, req.role, req.patient_id, req.patient_name, req.limit
    )
    stats = _build_stats(rows)
    context = _rows_to_context(rows)
    rows_json = [_row_to_dict(r) for r in rows]

    if client:
        system = (
            "You are a warm, knowledgeable clinical assistant for SecureEHR — a medical records platform. "
            "Your job is to help doctors, auditors, and patients understand encrypted audit records in plain English. "
            "Use ONLY the record data provided — never invent diagnoses, medications, or clinical details. "
            "Speak naturally and professionally, like a helpful colleague. "
            "Format dates as 'Month Day, Year' (e.g. March 25, 2026). "
            "When listing multiple items, use bullet points. For single answers, write a short paragraph. "
            "If a field is missing or empty, say 'not recorded' rather than showing dashes or None. "
            "Keep answers concise but complete — 2 to 6 sentences for summaries."
        )
        user_prompt = (
            f"The user asked: \"{req.question}\"\n\n"
            f"Here are the relevant patient records (most recent first):\n{context}\n\n"
            f"Summary stats: {stats['total_logs']} total records, "
            f"top diagnoses: {[d for d, _ in stats['top_diagnoses'][:3]]}, "
            f"top medications: {[m for m, _ in stats['top_medications'][:3]]}, "
            f"last visit: {stats['last_visit']}.\n\n"
            "Please answer the user's question naturally and helpfully based only on the above data."
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
            return {
                "answer": resp.choices[0].message.content,
                "stats": stats,
                "rows": rows_json,
            }
        except Exception as e:
            print("OpenAI error:", e)

    # ── Human-friendly fallback when OpenAI key is absent ──────────────────────
    if not rows:
        return {
            "answer": "I don't see any records matching your query. Try adjusting the patient ID filter, or check that records have been added to the system.",
            "stats": stats,
            "rows": rows_json,
        }

    q        = (req.question or "").strip().lower()
    first    = rows[0]
    total    = stats["total_logs"]
    top_dx   = stats["top_diagnoses"]
    top_meds = stats["top_medications"]

    def fmt(ts):
        return _fmt_date(ts) if ts else "an unknown date"

    if any(kw in q for kw in ("last visit", "recent", "latest", "show last")):
        name   = first.patient_name or f"patient {first.patient_id}"
        date   = fmt(first.timestamp)
        dx     = first.diagnosis  or "no diagnosis recorded"
        med    = first.medication or "no medication recorded"
        vdate  = f"Visit date was {first.visit_date}. " if first.visit_date else ""
        vitals = f"Vitals: {first.vitals}. " if first.vitals else ""
        notes  = f'Notes: "{first.notes[:180]}." ' if first.notes else ""
        answer = (
            f"The most recent visit was on {date} for {name}. "
            f"They were diagnosed with {dx} and prescribed {med}. "
            f"{vdate}{vitals}{notes}"
        ).strip()

    elif "medication" in q or "prescription" in q or "drug" in q:
        unique_meds = list(dict.fromkeys(
            r.medication.strip() for r in rows if (r.medication or "").strip()
        ))
        if unique_meds:
            if len(unique_meds) == 1:
                answer = f"There is 1 medication on record: {unique_meds[0]}."
            else:
                bullet_list = "\n".join(f"• {m}" for m in unique_meds[:10])
                answer = f"Here are the medications recorded across {total} entries:\n{bullet_list}"
        else:
            answer = "No medications have been recorded in the available records."

    elif "diagnos" in q or "condition" in q or "illness" in q:
        if top_dx:
            if len(top_dx) == 1:
                answer = f"The only diagnosis on record is {top_dx[0][0]}, appearing {top_dx[0][1]} time(s)."
            else:
                bullet_list = "\n".join(f"• {d.title()} — {c} record(s)" for d, c in top_dx)
                answer = f"Here are the most common diagnoses across {total} records:\n{bullet_list}"
        else:
            answer = "No diagnoses have been recorded yet."

    elif any(kw in q for kw in ("summary", "summarize", "overview", "tell me about")):
        name  = first.patient_name or f"patient {first.patient_id}"
        last  = fmt(first.timestamp)
        dx_list  = ", ".join(d.title() for d, _ in top_dx[:3])  if top_dx  else "none recorded"
        med_list = ", ".join(m.title() for m, _ in top_meds[:3]) if top_meds else "none recorded"
        answer = (
            f"Here's a summary of the {total} record(s) I can see. "
            f"The most recent visit was {last} for {name}. "
            f"Top diagnoses: {dx_list}. "
            f"Top medications: {med_list}."
        )

    elif any(kw in q for kw in ("how many", "count", "total", "unique patient")):
        unique_pts = len({r.patient_id for r in rows if r.patient_id})
        answer = (
            f"There are {total} record(s) in the current view across {unique_pts} unique patient(s). "
            f"The most recent entry was on {fmt(first.timestamp)}."
        )

    elif any(kw in q for kw in ("note", "observation", "comment")):
        notes_rows = [r for r in rows if (r.notes or "").strip()]
        if notes_rows:
            r = notes_rows[0]
            answer = (
                f"The most recent clinical note is from {fmt(r.timestamp)} "
                f"for {r.patient_name or r.patient_id}: \"{r.notes[:300]}\""
            )
        else:
            answer = "No clinical notes have been recorded in the available records."

    else:
        # Generic friendly overview
        last_date = fmt(first.timestamp)
        dx_str    = top_dx[0][0].title()  if top_dx  else "none on record"
        med_str   = top_meds[0][0].title() if top_meds else "none on record"
        answer = (
            f"I found {total} record(s) to work with. "
            f"The latest activity was on {last_date}. "
            f"Most common diagnosis: {dx_str}. Most common medication: {med_str}. "
            f"Feel free to ask me something more specific — like 'show last visit', 'list all diagnoses', or 'summarize recent visits'."
        )

    return {"answer": answer, "stats": stats, "rows": rows_json}


# ─── FAQ Query (parameterized — no SQL injection) ─────────────────────────────

class FAQReq(BaseModel):
    question: str
    patient_id: Optional[str] = None


@router.post("/faq-query")
def faq_query(req: FAQReq, db: Session = Depends(get_db)):
    """
    Structured FAQ endpoint. Accepts a JSON body — no asyncio.run() needed.
    All SQL uses bound parameters to prevent injection.
    """
    q = req.question.lower().strip()

    try:
        if "how many patients" in q:
            result = db.execute(
                text("SELECT COUNT(DISTINCT patient_id) FROM audit_logs")
            ).scalar()
            return {"reply": f"There are {result} unique patients in the system."}

        elif "how many records" in q:
            result = db.execute(text("SELECT COUNT(*) FROM audit_logs")).scalar()
            return {"reply": f"There are {result} audit records logged."}

        elif "most common diagnosis" in q:
            row = db.execute(text("""
                SELECT diagnosis, COUNT(*) AS cnt
                FROM audit_logs
                WHERE diagnosis IS NOT NULL AND diagnosis != ''
                GROUP BY diagnosis ORDER BY cnt DESC LIMIT 1
            """)).fetchone()
            if not row:
                return {"reply": "No diagnoses found."}
            return {"reply": f"Most common diagnosis: '{row[0]}' ({row[1]} entries)."}

        elif "patient summary" in q and req.patient_id:
            # Parameterized — no f-string interpolation into SQL
            row = db.execute(
                text("""
                    SELECT patient_id, patient_name, age, gender, diagnosis,
                           medication, visit_date, vitals, notes
                    FROM audit_logs WHERE patient_id = :pid
                    ORDER BY timestamp DESC LIMIT 1
                """),
                {"pid": req.patient_id},
            ).fetchone()
            if not row:
                return {"reply": f"No records found for patient '{req.patient_id}'."}
            return {
                "reply": (
                    f"Patient: {row[1]} (ID: {row[0]})\n"
                    f"Age/Gender: {row[2]}/{row[3]}\n"
                    f"Diagnosis: {row[4]}\nMedication: {row[5]}\n"
                    f"Visit: {row[6]}\nVitals: {row[7]}\nNotes: {row[8]}"
                )
            }

        return {"reply": "❓ I couldn't understand that question."}

    except Exception as e:
        print("FAQ error:", e)
        return {"reply": "⚠️ Failed to process query."}