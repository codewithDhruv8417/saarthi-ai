from database import Officer, SessionLocal


db = SessionLocal()

try:
    existing_officer = (
        db.query(Officer)
        .filter(Officer.email == "officer@saarthiai.gov.in")
        .first()
    )

    if existing_officer:
        print("Demo officer already exists.")
    else:
        officer = Officer(
            name="Rajesh Kumar",
            email="officer@saarthiai.gov.in",
            department="Public Works Department (PWD)",
            is_active=True,
        )

        db.add(officer)
        db.commit()

        print("Demo officer created successfully.")

finally:
    db.close()