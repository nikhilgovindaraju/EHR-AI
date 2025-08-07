import os
import json
import hashlib
from base64 import b64encode
from datetime import datetime
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from crypto.generate_keys import generate_keys  # ✅ Import key generator

def encrypt_log(log_data: dict, recipient_pubkey_path: str = None):
    # Get sender and recipient user IDs
    from_user = log_data.get("user_id")
    to_user = log_data.get("patient_id")

    # Use default recipient public key path if not explicitly provided
    if not recipient_pubkey_path:
        recipient_pubkey_path = f"public_keys/{to_user}.pem"

    # ✅ Auto-generate keys if public key missing
    if not os.path.exists(recipient_pubkey_path):
        print(f"[!] Public key for '{to_user}' not found. Generating keys...")
        generate_keys(to_user)

    # Convert log data to JSON string
    log_json = json.dumps(log_data)

    # --- AES Encryption ---
    aes_key = get_random_bytes(16)
    cipher_aes = AES.new(aes_key, AES.MODE_EAX)
    ciphertext, tag = cipher_aes.encrypt_and_digest(log_json.encode())
    nonce = cipher_aes.nonce

    # --- Encrypt AES key using recipient's RSA public key ---
    with open(recipient_pubkey_path, "rb") as f:
        pubkey = RSA.import_key(f.read())
    cipher_rsa = PKCS1_OAEP.new(pubkey)
    encrypted_aes_key = cipher_rsa.encrypt(aes_key)

    # --- Create Record Hash for Integrity ---
    hash_input = f"{log_json}-{datetime.utcnow()}".encode()
    record_hash = hashlib.sha256(hash_input).hexdigest()

    # Return encrypted components
    return {
        "encrypted_data": ciphertext,
        "encrypted_aes_key": encrypted_aes_key,
        "nonce": b64encode(nonce).decode(),
        "tag": b64encode(tag).decode(),
        "record_hash": record_hash
    }
