from passlib.context import CryptContext
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Hash import SHA256
from Crypto.Signature import pkcs1_15
import base64
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password Hashing ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- Load RSA Keys ---
def load_keys(user_id: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    keys_dir = os.path.join(base_dir, "..", "keys")

    pub_path = os.path.join(keys_dir, f"{user_id}_public.pem")
    priv_path = os.path.join(keys_dir, f"{user_id}_private.pem")

    if not os.path.exists(pub_path) or not os.path.exists(priv_path):
        raise FileNotFoundError(f"Key files for {user_id} not found.")

    with open(pub_path, "rb") as f:
        public_key = RSA.import_key(f.read())
    with open(priv_path, "rb") as f:
        private_key = RSA.import_key(f.read())

    return public_key, private_key

# --- Encryption ---
def encrypt_data(plaintext: str, user_id: str):
    public_key, _ = load_keys(user_id)
    aes_key = get_random_bytes(16)
    cipher_aes = AES.new(aes_key, AES.MODE_EAX)
    ciphertext, tag = cipher_aes.encrypt_and_digest(plaintext.encode())  # ← FIXED HERE

    encrypted_aes_key = PKCS1_OAEP.new(public_key).encrypt(aes_key)

    return ciphertext, encrypted_aes_key, cipher_aes.nonce, tag


# --- Signature ---
def generate_signature(plaintext: str, user_id: str) -> str:
    _, private_key = load_keys(user_id)
    h = SHA256.new(plaintext.encode())
    signer = pkcs1_15.new(private_key)
    signature = signer.sign(h)
    return base64.b64encode(signature).decode()


# --- Hash (for tamper detection) ---
def compute_hash(data: str) -> str:
    h = SHA256.new(data.encode())
    return h.hexdigest()
