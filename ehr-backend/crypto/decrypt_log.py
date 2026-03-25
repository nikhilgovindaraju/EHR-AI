import os
import json
from base64 import b64decode
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _private_key_path(user_id: str) -> str:
    return os.path.join(_BACKEND_DIR, "keys", f"{user_id}_private.pem")


def decrypt_log(
    encrypted_data: bytes,
    encrypted_aes_key: bytes,
    nonce_b64: str,
    tag_b64: str,
    user_id: str,
) -> dict:
    """
    Decrypt a log entry using the user's RSA private key.
    Pass user_id (the doctor who created the log) — key is loaded from disk.
    """
    key_path = _private_key_path(user_id)
    if not os.path.exists(key_path):
        raise FileNotFoundError(f"Private key for '{user_id}' not found at {key_path}")

    with open(key_path, "rb") as f:
        private_key = RSA.import_key(f.read())

    # Decrypt the AES session key
    aes_key = PKCS1_OAEP.new(private_key).decrypt(encrypted_aes_key)

    # AES-EAX decryption
    nonce = b64decode(nonce_b64)
    tag = b64decode(tag_b64)
    cipher_aes = AES.new(aes_key, AES.MODE_EAX, nonce=nonce)
    decrypted = cipher_aes.decrypt_and_verify(encrypted_data, tag)

    return json.loads(decrypted.decode())