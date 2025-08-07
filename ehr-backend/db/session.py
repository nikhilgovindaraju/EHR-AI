from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres.qlqhtygvzmomsywrrzkd:swa03gov140@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require"


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
 