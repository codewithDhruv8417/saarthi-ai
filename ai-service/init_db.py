from database import Base, engine

Base.metadata.create_all(bind=engine)

print("SaarthiAI database initialized successfully.")