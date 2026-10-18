from typing import Any, Generator
from app.config import settings

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

    class DeclarativeBase:  # type: ignore
        metadata = None

        def __init__(self, **kwargs: Any) -> None:
            for k, v in kwargs.items():
                setattr(self, k, v)

    Session = object  # type: ignore
    create_engine = None
    sessionmaker = None


class InMemorySession:
    """Fallback in-memory database session used when SQLAlchemy is not installed."""

    def __init__(self) -> None:
        self.store: dict[str, Any] = {}

    def get(self, model: Any, id_val: str) -> Any:
        return self.store.get(id_val)

    def add(self, record: Any) -> None:
        self.store[record.id] = record

    def delete(self, record: Any) -> None:
        self.store.pop(record.id, None)

    def commit(self) -> None:
        pass

    def flush(self) -> None:
        pass

    def refresh(self, record: Any) -> None:
        pass

    def scalars(self, stmt: Any) -> Any:
        class ScalarResult:
            def __init__(self, items: list) -> None:
                self.items = items

            def all(self) -> list:
                return self.items

        return ScalarResult(list(self.store.values()))

    def close(self) -> None:
        pass


fallback_session = InMemorySession()

if SQLALCHEMY_AVAILABLE and create_engine is not None and sessionmaker is not None:
    connect_args = {}
    if settings.database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    engine = create_engine(
        settings.database_url,
        connect_args=connect_args,
        echo=False,
        future=True,
    )

    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False,
    )

    class Base(DeclarativeBase):
        """Base declarative class for all SQLAlchemy models."""
        pass
else:
    engine = None
    SessionLocal = None

    class Base(DeclarativeBase):
        """Base declarative class fallback when SQLAlchemy is not installed."""
        pass


def get_db() -> Generator:
    """FastAPI dependency for obtaining a database session."""
    if not SQLALCHEMY_AVAILABLE or SessionLocal is None:
        yield fallback_session
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables."""
    if not SQLALCHEMY_AVAILABLE or engine is None:
        return

    import app.models.analysis  # noqa: F401

    if hasattr(Base, "metadata") and Base.metadata is not None:
        Base.metadata.create_all(bind=engine)
