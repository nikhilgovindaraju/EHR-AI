from pydantic import BaseModel
from typing import Optional

class RegisterUser(BaseModel):
    user_id: str
    password: str
    role: str

class LoginUser(BaseModel):
    user_id: str
    password: str
    role: str

class AuditLogCreate(BaseModel):
    user_id: str
    patient_id: str
    action: str
    data: str
    patient_name: str
    age: int
    diagnosis: str
    medication: str

    
class ModifyAuditLog(BaseModel):
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    diagnosis: Optional[str] = None
    medication: Optional[str] = None
    notes: Optional[str] = None
    visit_date: Optional[str] = None
    vitals: Optional[str] = None

