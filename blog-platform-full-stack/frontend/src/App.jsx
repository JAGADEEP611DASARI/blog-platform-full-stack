import React, { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams
} from "react-router-dom";
import api from "./api";

const getUser = () => {
  return JSON.parse(localStorage.getItem("user") || "null");
};

// =========================
// Layout
// =========================
function Layout({ children }) {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div>
      <nav className="nav">
        <Link className="brand" to="/">
          BlogSpace
        </Link>

        <div className="navlinks">
          <Link to="/">Home</Link>

          {user ? (
            <>
              <Link to="/create">Write</Link>

              <span className="welcome">
                Hi, {user.name}
              </span>

              <button onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main className="container">
        {children}
      </main>
    </div>
  );
}

// =========================
// Home
// =========================
function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api
      .get("/posts")
      .then((response) => {
        setPosts(response.data);
      })
      .catch((error) => {
        console.error("Failed to load posts:", error);
      });
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Share your ideas.</h1>
        <p>
          Write, publish and discuss with the community.
        </p>
      </section>

      <div className="post-grid">
        {posts.map((post) => (
          <article className="card" key={post._id}>
            <h2>{post.title}</h2>

            <p className="meta">
              By {post.author?.name} ·{" "}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>

            <p>
              {post.content.length > 180
                ? post.content.slice(0, 180) + "..."
                : post.content}
            </p>

            <Link
              className="read"
              to={`/posts/${post._id}`}
            >
              Read article →
            </Link>
          </article>
        ))}
      </div>

      {!posts.length && (
        <div className="empty">
          No posts yet. Be the first to write one.
        </div>
      )}
    </>
  );
}

// =========================
// Login / Register
// =========================
function Auth({ mode }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post(
        `/auth/${mode}`,
        form
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Request failed"
      );
    }
  };

  return (
    <form
      className="auth card"
      onSubmit={submit}
    >
      <h1>
        {mode === "login"
          ? "Welcome back"
          : "Create account"}
      </h1>

      {mode === "register" && (
        <input
          type="text"
          placeholder="Full name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
          required
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value
          })
        }
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) =>
          setForm({
            ...form,
            password: e.target.value
          })
        }
        required
      />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="primary"
      >
        {mode === "login"
          ? "Login"
          : "Register"}
      </button>
    </form>
  );
}

// =========================
// Create Post
// =========================
function Editor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await api.post(
        "/posts",
        {
          title: title,
          content: content
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate(`/posts/${response.data._id}`);
    } catch (error) {
      console.error(
        "Publish error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.message ||
        "Could not publish the post"
      );
    }
  };

  return (
    <form
      className="editor card"
      onSubmit={submit}
    >
      <h1>Write a new post</h1>

      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        required
      />

      <textarea
        rows="14"
        placeholder="Write your article..."
        value={content}
        onChange={(e) =>
          setContent(e.target.value)
        }
        required
      />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="primary"
      >
        Publish
      </button>
    </form>
  );
}

// =========================
// Single Post
// =========================
function PostPage() {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const user = getUser();
  const navigate = useNavigate();

  const loadPost = async () => {
    try {
      const [postResponse, commentsResponse] =
        await Promise.all([
          api.get(`/posts/${id}`),
          api.get(`/posts/${id}/comments`)
        ]);

      setPost(postResponse.data);
      setComments(commentsResponse.data);
    } catch (error) {
      console.error(
        "Failed to load post:",
        error
      );

      setPost(null);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  const addComment = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      await api.post(
        `/posts/${id}/comments`,
        {
          text: text
        }
      );

      setText("");
      loadPost();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not add comment"
      );
    }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    try {
      await api.delete(`/posts/${id}`);
      navigate("/");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not delete post"
      );
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(
        `/comments/${commentId}`
      );

      loadPost();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Could not delete comment"
      );
    }
  };

  if (!post) {
    return (
      <div className="empty">
        Post not found.
      </div>
    );
  }

  const canEdit =
    user &&
    (
      user.id === post.author?._id ||
      user.role === "admin"
    );

  return (
    <article className="article">
      <h1>{post.title}</h1>

      <p className="meta">
        By {post.author?.name} ·{" "}
        {new Date(
          post.createdAt
        ).toLocaleDateString()}
      </p>

      <div className="content">
        {post.content
          .split("\n")
          .map((line, index) => (
            <p key={index}>
              {line}
            </p>
          ))}
      </div>

      {canEdit && (
        <div className="actions">
          <button
            onClick={() =>
              alert(
                "Edit API is available. Edit UI can be added next."
              )
            }
          >
            Edit
          </button>

          <button
            className="danger"
            onClick={deletePost}
          >
            Delete
          </button>
        </div>
      )}

      <section className="comments">
        <h2>
          Comments ({comments.length})
        </h2>

        {user ? (
          <div className="comment-box">
            <textarea
              rows="4"
              placeholder="Write a comment..."
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
            />

            <button
              className="primary"
              onClick={addComment}
            >
              Comment
            </button>
          </div>
        ) : (
          <p>
            Login to comment.
          </p>
        )}

        {comments.map((comment) => (
          <div
            className="comment"
            key={comment._id}
          >
            <b>
              {comment.author?.name}
            </b>

            <span>
              {new Date(
                comment.createdAt
              ).toLocaleString()}
            </span>

            <p>
              {comment.text}
            </p>

            {user &&
              (
                user.id === comment.author?._id ||
                user.role === "admin"
              ) && (
                <button
                  onClick={() =>
                    deleteComment(
                      comment._id
                    )
                  }
                >
                  Delete
                </button>
              )}
          </div>
        ))}
      </section>
    </article>
  );
}

// =========================
// App
// =========================
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Auth mode="login" />}
        />

        <Route
          path="/register"
          element={<Auth mode="register" />}
        />

        <Route
          path="/create"
          element={<Editor />}
        />

        <Route
          path="/posts/:id"
          element={<PostPage />}
        />
      </Routes>
    </Layout>
  );
}