import "./index.css";

import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const truncate = (str, n = 160) => (str.length > n ? str.slice(0, n) + "…" : str);

/* ── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span>{msg}</span>
      <button className="toast__close" onClick={onClose}>×</button>
    </div>
  );
}

/* ── PostCard ───────────────────────────────────────────────────────────── */
function PostCard({ post, onOpen, onDelete }) {
  return (
    <article className="card" onClick={() => onOpen(post)}>
      <div className="card__meta">
        <span className="card__author">{post.author}</span>
        <span className="card__date">{formatDate(post.created_at)}</span>
      </div>
      <h2 className="card__title">{post.title}</h2>
      <p className="card__excerpt">{truncate(post.content)}</p>
      <div className="card__footer">
        <span className="card__read">Read more →</span>
        <button className="card__delete" onClick={(e) => { e.stopPropagation(); onDelete(post); }}>
          Delete
        </button>
      </div>
    </article>
  );
}

/* ── PostModal ──────────────────────────────────────────────────────────── */
function PostModal({ post, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>×</button>
        <div className="modal__meta">
          <span className="card__author">{post.author}</span>
          <span className="card__date">{formatDate(post.created_at)}</span>
        </div>
        <h1 className="modal__title">{post.title}</h1>
        <div className="modal__body">{post.content}</div>
      </div>
    </div>
  );
}

/* ── CreateForm ─────────────────────────────────────────────────────────── */
function CreateForm({ onCreated, onToast }) {
  const [form, setForm] = useState({ title: "", content: "", author: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) {
      onToast("All fields are required.", "error"); return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      const post = await r.json();
      onCreated(post);
      setForm({ title: "", content: "", author: "" });
      onToast("Post published!", "success");
    } catch {
      onToast("Failed to publish. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-form" onSubmit={submit} noValidate>
      <h2 className="create-form__heading">New Post</h2>
      <div className="create-form__row">
        <input className="input" placeholder="Your name" value={form.author} onChange={set("author")} />
        <input className="input" placeholder="Post title" value={form.title} onChange={set("title")} />
      </div>
      <textarea
        className="input input--textarea"
        placeholder="Write your post…"
        rows={5}
        value={form.content}
        onChange={set("content")}
      />
      <button className="btn" disabled={loading}>{loading ? "Publishing…" : "Publish →"}</button>
    </form>
  );
}

/* ── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const addToast = (msg, type = "success") => setToast({ msg, type });

  const fetchPosts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/posts`);
      const data = await r.json();
      setPosts(data);
    } catch {
      addToast("Could not load posts.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreated = (post) => setPosts((prev) => [post, ...prev]);

  const handleDelete = async (post) => {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      const r = await fetch(`${API}/posts/${post.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      addToast("Post deleted.");
    } catch {
      addToast("Delete failed.", "error");
    }
  };

  return (
    <>
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__dot" />
            <span className="header__name">Inkwell</span>
          </div>
          <span className="header__tagline">A minimal blog platform</span>
        </div>
      </header>

      <main className="main">
        <CreateForm onCreated={handleCreated} onToast={addToast} />

        <section className="feed">
          <h2 className="feed__heading">
            {loading ? "Loading…" : posts.length === 0 ? "No posts yet — be the first!" : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
          </h2>
          <div className="grid">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onOpen={setSelected} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      </main>

      {selected && <PostModal post={selected} onClose={() => setSelected(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
