import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { createRoom } from "../lib/api.ts";
import "./HomePage.css";

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
    <div className="container">
      <h1 className="home-title">🎲 Yatzy 🎲</h1>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <button type="button" className="button" onClick={create}>
        {!creating ? <>New game</> : <>Loading...</>}
      </button>
      {error && <p className="error">{error}</p>}

      <div className="divider">or</div>

      <form className="row" onSubmit={join}>
        <input
          className="input code-input"
          placeholder="Lobby code"
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
    </div>
    // <main className="page">

    // </main>
  );
}

export default HomePage;
