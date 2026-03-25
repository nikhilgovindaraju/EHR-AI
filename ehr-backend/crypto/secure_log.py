import os
import json
import hashlib
from base64 import b64encode
from datetime import datetime
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from crypto.generate_keys import generate_keys

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _public_key_path(user_id: str) -> str:
    return os.path.join(_BACKEND_DIR, "public_keys", f"{user_id}.pem")


def encrypt_log(log_data: dict, recipient_user_id: str = None) -> dict:
    """
    Hybrid RSA-AES encryption of log_data.
    recipient_user_id defaults to the doctor (user_id) so the doctor's public
    key is used — meaning only the doctor's private key can decrypt their logs.
    """
    recipient = recipient_user_id or log_data.get("user_id")
    pubkey_path = _public_key_path(recipient)

    # Auto-generate keys if this is the first time we've seen this user
    if not os.path.exists(pubkey_path):
        print(f"[!] Public key for '{recipient}' not found — generating...")
        generate_keys(recipient)

    log_json = json.dumps(log_data, default=str)

    # AES-128 EAX mode encryption
    aes_key = get_random_bytes(16)
    cipher_aes = AES.new(aes_key, AES.MODE_EAX)
    ciphertext, tag = cipher_aes.encrypt_and_digest(log_json.encode())

    # RSA-encrypt the AES key with recipient's public key
    with open(pubkey_path, "rb") as f:
        pubkey = RSA.import_key(f.read())
    encrypted_aes_key = PKCS1_OAEP.new(pubkey).encrypt(aes_key)

    # SHA-256 integrity hash (used for the audit chain)
    record_hash = hashlib.sha256(
        f"{log_json}-{datetime.utcnow().isoformat()}".encode()
    ).hexdigest()

    return {
        "encrypted_data": ciphertext,
        "encrypted_aes_key": encrypted_aes_key,
        "nonce": b64encode(cipher_aes.nonce).decode(),
        "tag": b64encode(tag).decode(),
        "record_hash": record_hash,
    }