# Secure EHR AI – Encrypted, Auditable, AI-Powered Health Record System

A full-stack, cloud-native platform for securely logging, encrypting, and auditing patient medical records. Built with hybrid cryptography, blockchain-style hash chaining, role-based access control, and an AI-powered chatbot for intelligent interaction with sensitive health data.

**Live Demo:** [nikhilgovindaraju.github.io/EHR-AI](https://nikhilgovindaraju.github.io/EHR-AI)
**Backend API:** [ehr-ai-production.up.railway.app](https://ehr-ai-production.up.railway.app)

---

## Overview

**Secure EHR AI** is a medical audit management system built for three user roles:

| Role | Capabilities |
|------|-------------|
| Doctor | Add, modify, and delete own patient records |
| Auditor | View all records, validate and repair hash chains |
| Patient | View their own medical history and visit records |

---

## Features

### Secure Audit Logging
- Create, modify, and delete audit records with full patient metadata: ID, name, age, gender, diagnosis, vitals, medication, visit date, and notes
- Every record is encrypted before storage using hybrid AES + RSA encryption
- Records are tagged with action type: `CREATE`, `MODIFY`, or `DELETE`

### Hybrid Cryptography
- **AES-128 (EAX mode)** for authenticated encryption of patient data
- **RSA-2048 (PKCS1-OAEP)** for wrapping the AES key per record
- **SHA-256** for blockchain-style hash chain linking
- Nonce and authentication tag stored alongside encrypted data for tamper detection

### Automatic RSA Key Generation
- RSA-2048 key pairs are auto-generated for every user on registration
- Public keys used for encryption; private keys stored securely server-side
- Keys are reused for returning users — no redundant regeneration

### Blockchain-Style Audit Trail
- Every record stores the SHA-256 hash of the previous record, forming an unbreakable chain
- `/validate` endpoint scans the entire chain and reports any broken or tampered records
- `/rechain` endpoint rebuilds the hash chain after migrations or repairs

### Role-Based Access Control (RBAC)
- Doctors can only access and modify their own records
- Auditors have read access to all records across all doctors
- Patients can view only records belonging to their own patient ID
- Frontend dynamically adjusts navigation and options per role

### AI-Powered Medical Chatbot
- Integrated **OpenAI GPT-4o-mini** for natural language queries over audit records
- Answers questions about patient visit history, diagnoses, medication trends, and record counts
- Role-specific suggestions shown in the chat UI
- Graceful fallback responses when the API is unavailable

### Dashboard Analytics
- 8-week activity chart showing audit log volume over time
- Top diagnoses and top medications shown as horizontal bar charts
- Patient statistics and record summaries at a glance

### Advanced Log Viewer
- Filter logs by action type (CREATE / MODIFY / DELETE)
- Search by patient name, patient ID, diagnosis, or medication
- Paginated table view with color-coded action badges
- Export visible logs to PDF using jsPDF

### Multi-Step Audit Entry Form
- Step 1: Search for an existing patient by ID
- Step 2: Fill in or update patient details
- Step 3: Submit and encrypt the record server-side

### Patient Profile View
- Dedicated page per patient showing full visit history
- Summarizes diagnoses, medications, and visit dates

### Chain Validation UI
- One-click audit chain validation with pass/fail status per record
- Identifies and displays IDs of broken records
- Option to trigger rechain repair from the UI

---

## Tech Stack

### Frontend
| | |
|--|--|
| Framework | React 19 |
| Routing | React Router DOM 7 |
| UI | Bootstrap 5, Chakra UI 3, Material UI 7 |
| HTTP | Axios |
| Forms | React Hook Form |
| PDF Export | jsPDF + jsPDF-autotable |
| Animation | Framer Motion |
| Deployment | GitHub Pages (`gh-pages`) |

### Backend
| | |
|--|--|
| Framework | FastAPI 0.115 |
| Server | Uvicorn |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic 2 |
| Database Driver | psycopg2-binary |
| Password Hashing | passlib + bcrypt |
| Cryptography | pycryptodome (AES, RSA) |
| AI | OpenAI Python SDK (GPT-4o-mini) |
| Deployment | Railway |

### Database
- PostgreSQL (Railway managed)

---

## Architecture

```
EHR-AI/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginRegisterPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── AddAuditRecord.js
│   │   │   ├── ViewLogs.js
│   │   │   ├── ModifyRecord.js
│   │   │   ├── DeleteRecord.js
│   │   │   ├── PatientProfile.js
│   │   │   ├── ValidateChain.js
│   │   │   └── AuditChatbot.js
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   ├── Navbar.js
│   │   │   ├── Sidebar.js
│   │   │   └── Footer.js
│   │   └── services/
│   │       └── api.js
│   └── .env.production
│
└── ehr-backend/
    ├── main.py
    ├── Procfile
    ├── requirements.txt
    ├── routers/
    │   └── audit.py
    ├── crypto/
    │   ├── secure_log.py
    │   ├── decrypt_log.py
    │   ├── generate_keys.py
    │   └── validate_chain.py
    ├── models/
    │   ├── schemas.py
    │   ├── tables.py
    │   └── database.py
    ├── db/
    │   └── session.py
    └── utils/
        └── crypto.py
```

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/register` | Register a new user (doctor / auditor / patient) |
| POST | `/api/login` | Login and retrieve role + user ID |

### Audit Logs
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/audit/add-log` | Create a new encrypted audit record |
| GET | `/api/audit/logs` | Fetch logs (filtered by role) |
| PUT | `/api/audit/modify-log/{log_id}` | Update an existing record |
| DELETE | `/api/audit/delete-log/{log_id}` | Delete a record |
| GET | `/api/audit/validate` | Validate the full SHA-256 hash chain |
| POST | `/api/audit/rechain` | Rebuild the hash chain |
| POST | `/api/audit/chat` | Query the AI chatbot |

---

## Cryptographic Flow

**On record creation:**
1. Generate a random AES-128 key
2. Encrypt patient data JSON with AES-EAX mode (produces ciphertext, nonce, tag)
3. Encrypt the AES key with the doctor's RSA-2048 public key
4. Store encrypted data, encrypted AES key, nonce, and tag in the database
5. Compute SHA-256 chain hash linking to the previous record

**On record retrieval:**
1. Fetch the encrypted record and RSA-encrypted AES key
2. Decrypt the AES key using the doctor's RSA private key
3. Decrypt patient data using AES key + nonce + tag
4. Return plaintext JSON to the frontend

---

## Environment Variables

### Backend (Railway)
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://nikhilgovindaraju.github.io
EHR_PRIVATE_KEY_B64=...
EHR_PUBLIC_KEY_B64=...
```

### Frontend
```
REACT_APP_API_BASE=https://ehr-ai-production.up.railway.app
```

---

## Local Development

### Backend
```bash
cd ehr-backend
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, OPENAI_API_KEY
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## Deployment

### Frontend (GitHub Pages)
```bash
cd frontend
npm run deploy
```

### Backend (Railway)
Push to `main` — Railway auto-deploys via the `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Planned Features
- Download logs as CSV / Excel
- Email alerts for hash chain breaks or critical actions
- Admin dashboard with cross-role filtering and analytics
