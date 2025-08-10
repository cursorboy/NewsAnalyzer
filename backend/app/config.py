from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"

    # External APIs
    google_api_key: str | None = None
    google_cse_id: str | None = None
    openai_api_key: str | None = None

    # Data stores
    database_url: str | None = None
    redis_url: str | None = None


settings = Settings()  # type: ignore 