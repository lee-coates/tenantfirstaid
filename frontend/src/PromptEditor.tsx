import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function PromptEditor() {
  const [prompt, setPrompt] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  /** Fetch current prompt immediately after mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/prompt");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { prompt: string };
        setPrompt(data.prompt);
        setEditValue(data.prompt);
      } catch {
        setPrompt("server error");
        setEditValue("server error");
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const handleUnauthorized = () => {
    localStorage.removeItem("password");
    navigate("/feedback", { replace: true });
  };

  /** Handlers */
  const startEditing = () => !loading && setIsEditing(true);
  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue(prompt);
  };
  const applyEdit = async () => {
    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editValue,
          password: localStorage.getItem("password"),
        }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { prompt: string };
      setPrompt(data.prompt);
      setEditValue(data.prompt);
      setIsEditing(false);
      setError(false);
    } catch {
      setError(true);
    }
  };

  const restoreDefault = async () => {
    try {
      const res = await fetch("/api/prompt?default=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: localStorage.getItem("password") }),
      });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { prompt: string };
      setPrompt(data.prompt);
      setEditValue(data.prompt);
      setIsEditing(false);
      setError(false);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="container">
      {/* header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Prompt Editing</h2>
        <Link
          to="/"
          className="button"
          style={{ padding: "0.4rem 1rem", textDecoration: "none" }}
        >
          Chat
        </Link>
      </div>

      {/* prompt display / editor */}
      <label
        style={{ fontWeight: 600, display: "block", margin: "1rem 0 0.25rem" }}
      >
        Current prompt
      </label>

      {isEditing ? (
        <textarea
          className="input"
          rows={4}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
        />
      ) : (
        <div
          className="label"
          style={{ minHeight: "4rem", display: "flex", alignItems: "center" }}
        >
          {loading ? (
            <span className="dot-pulse" style={{ fontStyle: "italic" }}>
              Loading…
            </span>
          ) : (
            <p style={{ margin: 0 }}>{prompt}</p>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>
          Server error. Please try again.
        </p>
      )}

      {/* action buttons */}
      {isEditing ? (
        <div
          style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
        >
          <button
            className="button"
            style={{ background: "#ddd", color: "#333" }}
            onClick={cancelEditing}
          >
            Cancel
          </button>
          <button className="button" onClick={applyEdit}>
            Apply
          </button>
        </div>
      ) : (
        <div
          style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
        >
          <button
            className="button"
            style={{ background: "#ddd", color: "#333" }}
            onClick={restoreDefault}
            disabled={loading}
          >
            Restore default
          </button>
          <button className="button" onClick={startEditing} disabled={loading}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
