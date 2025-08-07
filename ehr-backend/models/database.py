from db.session import engine
from sqlalchemy.orm import sessionmaker
from models.tables import Base

# ✅ Define SessionLocal
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
