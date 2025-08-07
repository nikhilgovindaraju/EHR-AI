import json
from base64 import b64decode
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA

def decrypt_log(
    encrypted_data: bytes,
    encrypted_aes_key: bytes,
    nonce_b64: str,
    tag_b64: str,
    private_key_path: str
):
    # Load user's private RSA key
    with open(private_key_path, "rb") as f:
        private_key = RSA.import_key(f.read())
    cipher_rsa = PKCS1_OAEP.new(private_key)

    # Decrypt the AES session key
    aes_key = cipher_rsa.decrypt(encrypted_aes_key)

    # Decode nonce and tag
    nonce = b64decode(nonce_b64)
    tag = b64decode(tag_b64)

    # AES decryption
    cipher_aes = AES.new(aes_key, AES.MODE_EAX, nonce=nonce)
    decrypted_data = cipher_aes.decrypt_and_verify(encrypted_data, tag)

    return json.loads(decrypted_data.decode())
