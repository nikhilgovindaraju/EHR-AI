import os
from Crypto.PublicKey import RSA

def generate_keys(user_id: str):
    # Create folders if they don't exist
    os.makedirs("keys", exist_ok=True)
    os.makedirs("public_keys", exist_ok=True)

    # Generate RSA key pair
    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    # Save private key in 'keys/' folder
    with open(f"keys/{user_id}_private.pem", "wb") as priv_file:
        priv_file.write(private_key)

    # Save public key in both 'keys/' and 'public_keys/'
    with open(f"keys/{user_id}_public.pem", "wb") as pub_file:
        pub_file.write(public_key)

    with open(f"public_keys/{user_id}.pem", "wb") as pub_out:
        pub_out.write(public_key)

    print(f"[+] Keys generated for {user_id}")
