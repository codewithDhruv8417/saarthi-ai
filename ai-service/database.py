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
# It will be created inside the ai-service folder.
DATABASE_URL = "sqlite:///./saarthi.db"


# Create SQLAlchemy database engine.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Create a database session factory.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Base class for all database models.
Base = declarative_base()


# =========================================================
# 2. COMPLAINT MODEL
# =========================================================

class Complaint(Base):
    """
    Stores citizen complaints and AI analysis results.
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
    #
    # These fields identify the officer currently responsible
    # for the complaint.
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
    # AI Confidence / Review
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

    image_filename = Column(
        String(255),
        nullable=True,
    )

    # -----------------------------------------------------
    # Timestamp
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
    # Active / Inactive Officer
    # -----------------------------------------------------

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )
