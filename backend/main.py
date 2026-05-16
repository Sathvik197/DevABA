from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blog.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Blog API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────────────────────

class Post(Base):
    __tablename__ = "posts"
    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(255), nullable=False)
    content    = Column(Text, nullable=False)
    author     = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ── Schemas ─────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title:   str
    content: str
    author:  str

class PostUpdate(BaseModel):
    title:   Optional[str] = None
    content: Optional[str] = None

class PostResponse(BaseModel):
    id:         int
    title:      str
    content:    str
    author:     str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ── DB Dependency ────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/posts", response_model=List[PostResponse])
def list_posts(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

@app.get("/posts/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.post("/posts", response_model=PostResponse, status_code=201)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    db_post = Post(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.put("/posts/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post: PostUpdate, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    for k, v in post.model_dump(exclude_unset=True).items():
        setattr(db_post, k, v)
    db_post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_post)
    return db_post

@app.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(db_post)
    db.commit()
