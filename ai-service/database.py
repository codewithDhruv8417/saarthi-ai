from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker


# =========================================================
# 1. DATABASE CONFIGURATION
# =========================================================

# SQLite database file.
# This file is stored inside the ai-service directory.
DATABASE_URL = "sqlite:///./saarthi.db"


# Create the SQLAlchemy database engine.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Create the database session factory.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Base class for all SQLAlchemy models.
Base = declarative_base()


# =========================================================
# 2. COMPLAINT MODEL
# =========================================================

class Complaint(Base):
    """
    Stores citizen complaints, AI analysis results,
    location information, and officer assignment.
    """

    __tablename__ = "complaints"

    # -----------------------------------------------------
    # Primary Key
    # -----------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # -----------------------------------------------------
    # Ticket Information
    # -----------------------------------------------------

    ticket_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    # -----------------------------------------------------
    # AI Analysis
    # -----------------------------------------------------

    issue_detected = Column(
        String(500),
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
    )

    priority = Column(
        String(20),
        nullable=False,
    )

    # -----------------------------------------------------
    # Government Department
    # -----------------------------------------------------

    department = Column(
        String(200),
        nullable=False,
    )

    # -----------------------------------------------------
    # Officer Assignment
    # -----------------------------------------------------

    assigned_officer_id = Column(
        Integer,
        nullable=True,
    )

    assigned_officer_name = Column(
        String(150),
        nullable=True,
    )

    # -----------------------------------------------------
    # Complaint Details
    # -----------------------------------------------------

    summary = Column(
        Text,
        nullable=False,
    )

    recommended_action = Column(
        Text,
        nullable=False,
    )

    # -----------------------------------------------------
    # AI Confidence / Human Review
    # -----------------------------------------------------

    confidence = Column(
        Float,
        nullable=False,
    )

    review_required = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    # -----------------------------------------------------
    # Complaint Status
    # -----------------------------------------------------

    status = Column(
        String(50),
        default="Submitted",
        nullable=False,
    )

    # -----------------------------------------------------
    # Citizen Information
    # -----------------------------------------------------

    citizen_description = Column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # Location Information
    # -----------------------------------------------------

    # GPS latitude
    latitude = Column(
        Float,
        nullable=True,
    )

    # GPS longitude
    longitude = Column(
        Float,
        nullable=True,
    )

    # Human-readable location/address
    address = Column(
        String(500),
        nullable=True,
    )

    # -----------------------------------------------------
    # Uploaded Image
    # -----------------------------------------------------

    image_filename = Column(
        String(255),
        nullable=True,
    )

    # -----------------------------------------------------
    # Creation Timestamp
    # -----------------------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# =========================================================
# 3. OFFICER MODEL
# =========================================================

class Officer(Base):
    """
    Stores government officers who can handle complaints.
    """

    __tablename__ = "officers"

    # -----------------------------------------------------
    # Primary Key
    # -----------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # -----------------------------------------------------
    # Officer Information
    # -----------------------------------------------------

    name = Column(
        String(150),
        nullable=False,
    )

    email = Column(
        String(200),
        unique=True,
        nullable=False,
        index=True,
    )

    department = Column(
        String(200),
        nullable=False,
    )

    # -----------------------------------------------------
    # Officer Active Status
    # -----------------------------------------------------

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )
