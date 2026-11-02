import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import NameDialog from "../components/NameDialog.tsx";
import { createRoom } from "../lib/api.ts";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const message = (useLocation().state as { message?: string } | null)?.message;
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");

  async function create(name: string) {
    const { roomId } = await createRoom(name);
    navigate(`/lobby/${roomId}`);
  }

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/lobby/${code.replace(/\s/g, "").toUpperCase()}`);
  }

  return (
    <main className="page">
      <h1 className="home-title">Free Yatzy</h1>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        className="button"
        onClick={() => setCreating(true)}
      >
        Create new game
      </button>

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

      {creating && (
        <NameDialog
          title="Create game"
          submitLabel="Create"
          onSubmit={create}
          onCancel={() => setCreating(false)}
        />
      )}
    </main>
  );
}

export default HomePage;
