import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { createRoom } from "../lib/api.ts";
import styles from "./HomePage.module.css";

function HomePage() {
  const navigate = useNavigate();
  const message = (useLocation().state as { message?: string } | null)?.message;
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    try {
      navigate(`/lobby/${await createRoom()}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/lobby/${code.replace(/\s/g, "").toUpperCase()}`);
  }

  return (
    <main className={`card ${styles.home}`}>
      <h1>🎲 Yatzy 🎲</h1>

      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}

      <button type="button" className="button" onClick={create}>
        {!creating ? <>New game</> : <>Loading...</>}
      </button>
      {error && <p className="error">{error}</p>}

      <div className={styles.divider}>or</div>

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

export default HomePage;
