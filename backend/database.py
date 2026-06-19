import os
from pathlib import Path
from urllib.parse import quote_plus, unquote, urlparse, urlunparse

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Load .env from project root (parent of backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


def _normalize_database_url(raw_url: str) -> str:
    """Ensure asyncpg driver and URL-encode passwords with special characters (!, #, @, etc.)."""
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    parsed = urlparse(raw_url)
    if parsed.username and parsed.password:
        # Rebuild with properly encoded credentials
        encoded_user = quote_plus(unquote(parsed.username))
        encoded_pass = quote_plus(unquote(parsed.password))
        host = parsed.hostname or ""
        port = f":{parsed.port}" if parsed.port else ""
        netloc = f"{encoded_user}:{encoded_pass}@{host}{port}"
        raw_url = urlunparse((
            parsed.scheme,
            netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            parsed.fragment,
        ))

    if raw_url.startswith("postgresql://") and "+asyncpg" not in raw_url:
        raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return raw_url


DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_PUBLIC_URL")
    or os.getenv("DATABASE_URL")
    or "postgresql://postgres:postgres@localhost:5432/agency_platform"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"timeout": 10}
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    from models import Base as ModelsBase  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(ModelsBase.metadata.create_all)
