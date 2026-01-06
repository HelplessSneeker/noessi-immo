from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import properties, credits, transactions, documents

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Immo Manager API",
    description="API für die Verwaltung von Eigentumswohnungen in Österreich",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(properties.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Immo Manager API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
