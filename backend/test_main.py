import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, Base, get_db

# Use SQLite for tests (no Postgres needed in CI)
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_health_check():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_create_post():
    r = client.post("/posts", json={"title": "Hello", "content": "World", "author": "Alice"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Hello"
    assert data["author"] == "Alice"
    assert "id" in data


def test_list_posts_empty():
    r = client.get("/posts")
    assert r.status_code == 200
    assert r.json() == []


def test_list_posts():
    client.post("/posts", json={"title": "Post 1", "content": "...", "author": "Bob"})
    client.post("/posts", json={"title": "Post 2", "content": "...", "author": "Carol"})
    r = client.get("/posts")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_post():
    created = client.post("/posts", json={"title": "My Post", "content": "Content", "author": "Dave"}).json()
    r = client.get(f"/posts/{created['id']}")
    assert r.status_code == 200
    assert r.json()["title"] == "My Post"


def test_get_post_not_found():
    r = client.get("/posts/9999")
    assert r.status_code == 404


def test_update_post():
    created = client.post("/posts", json={"title": "Old", "content": "Old", "author": "Eve"}).json()
    r = client.put(f"/posts/{created['id']}", json={"title": "New Title"})
    assert r.status_code == 200
    assert r.json()["title"] == "New Title"
    assert r.json()["content"] == "Old"


def test_delete_post():
    created = client.post("/posts", json={"title": "To Delete", "content": "...", "author": "Frank"}).json()
    r = client.delete(f"/posts/{created['id']}")
    assert r.status_code == 204
    r2 = client.get(f"/posts/{created['id']}")
    assert r2.status_code == 404


def test_pagination():
    for i in range(5):
        client.post("/posts", json={"title": f"Post {i}", "content": "...", "author": "G"})
    r = client.get("/posts?skip=0&limit=3")
    assert len(r.json()) == 3
