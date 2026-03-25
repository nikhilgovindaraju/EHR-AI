import os
from Crypto.PublicKey import RSA

# Resolve paths relative to THIS file, not the CWD — fixes breakage when
# uvicorn is run from a different working directory
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def generate_keys(user_id: str):
    keys_dir = os.path.join(_BACKEND_DIR, "keys")
    pub_dir = os.path.join(_BACKEND_DIR, "public_keys")
    os.makedirs(keys_dir, exist_ok=True)
    os.makedirs(pub_dir, exist_ok=True)

    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    with open(os.path.join(keys_dir, f"{user_id}_private.pem"), "wb") as f:
        f.write(private_key)
    with open(os.path.join(keys_dir, f"{user_id}_public.pem"), "wb") as f:
        f.write(public_key)
    with open(os.path.join(pub_dir, f"{user_id}.pem"), "wb") as f:
        f.write(public_key)

    print(f"[+] RSA keys generated for '{user_id}'")