# 🛡️ Secure EHR AI – Encrypted, Auditable, AI-Powered Health Record System

A full-stack, cloud-native platform designed to securely log, encrypt, and audit patient medical records.  
This system integrates modern cryptography (AES, RSA), blockchain-style hash chaining, and an OpenAI-powered chatbot to enable secure, intelligent interactions with sensitive health data.

---

## 🚀 Overview

**Secure EHR AI** is a robust medical audit system built for:
- **Doctors**: To create, modify, and manage encrypted patient records  
- **Auditors**: To verify data integrity through hash validation  
- **Administrators**: To oversee role-based access and upcoming dashboard insights

It combines:
- 🔐 End-to-end encryption of medical logs  
- 🧠 AI-powered querying of patient history  
- 🧾 Immutable audit trails with hash chaining  
- 🧑‍⚕️ Role-based access for real-world medical workflows  

---

## 🔐 Core Features

### 1️⃣ Secure Audit Logging
- Add, modify, or delete audit records with patient metadata:
  - Patient ID, name, age, gender, diagnosis, vitals, visit date, notes, medication
- Every record is encrypted:
  - **AES-128** for data
  - **RSA-2048** for AES key encryption
- Logs are signed with:
  - Timestamps, hash chain values, and optional digital signatures

---

### 2️⃣ On-Demand RSA Key Generation
- On doctor registration:
  - System auto-generates **RSA key pairs**
  - Keys stored securely in **Supabase** — no local storage or exposure
- Key reuse for returning users avoids regeneration

---

### 3️⃣ Encrypted Key Management System
- AES keys, nonces, and tags stored securely in the `audit_logs` table
- A dedicated `user_keys` table stores:
  - `user_id`
  - `public_key` (PEM)
  - `private_key` (AES-encrypted using a backend `.env` secret)

---

### 4️⃣ Role-Based Access Control
| Role     | Capabilities                              |
|----------|-------------------------------------------|
| 👨‍⚕️ Doctor | Add, update, and delete own patient records |
| 🕵️ Auditor | View all records, validate hash chains     |

---

### 5️⃣ AI-Powered Medical Chatbot
- Integrated **OpenAI GPT-3.5** for natural language queries
- Responds to:
  - Record summaries
  - Diagnosis insights
  - Recent patient visits
  - Patient counts, trends, and metadata
- SQL-augmented reasoning for structured FAQs

---

### 6️⃣ Blockchain-style Audit Trail Validation
- Every audit record links to the previous via **SHA-256 hash**
- `/validate` endpoint checks the entire chain for:
  - Data tampering
  - Broken integrity

---

### 7️⃣ Multi-Step Audit Entry Form (Frontend)
- Built using **React + Bootstrap**
- Steps:
  - Step 1: Check if patient exists
  - Step 2: Enter patient data
  - Step 3: Securely submit record
- Uses `axios` for FastAPI integration with authentication headers

---

### 🧾 Planned Features
- 🔄 Download logs as CSV/Excel
- 📊 Admin dashboard with filtering and analytics
- 🔔 Email alerts for hash breaks or critical actions

---

## 🧰 Tech Stack

| Layer     | Tools & Libraries                                      |
|-----------|--------------------------------------------------------|
| Frontend  | React, Bootstrap, Axios                                |
| Backend   | FastAPI, Python, Pydantic, JWT                         |
| Database  | PostgreSQL (via Supabase)                              |
| Security  | AES-128, RSA-2048, SHA-256, HMAC, Hash Chaining        |
| AI Layer  | OpenAI GPT-3.5 (chatbot integration, dynamic SQL FAQs) |

---

