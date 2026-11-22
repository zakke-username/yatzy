import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { createRoom } from "../lib/api.ts";
import styles from "./MainMenu.module.css";

function MainMenu() {
  const navigate = useNavigate();
  const message = (useLocation().state as { message?: string } | null)?.message;
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    try {
      navigate(`/${await createRoom()}`);
    } catch (err) {
      setError((err as Error).message);
      setCreating(false);
    }
  }

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/${code.replace(/\s/g, "").toUpperCase()}`);
  }

  return (
    <main className={`card ${styles.home}`}>
      <h1>🎲 Yatzy 🎲</h1>

      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        className="button"
        disabled={creating}
        onClick={create}
      >
        {creating ? "Loading..." : "New game"}
      </button>
      {error && <p className="error">{error}</p>}
      <hr />
      <form onSubmit={join}>
        <input
          placeholder="Enter lobby code"
          aria-label="Lobby code"
          autoComplete="off"
          spellCheck={false}
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="submit" className="button">
          Join
        </button>
      </form>
    </main>
  );
}

export default MainMenu;
