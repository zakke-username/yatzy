import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { createRoom } from "../lib/api.ts";

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
    <main className="card m-auto flex max-w-[min(24rem,100%-2rem)] flex-col gap-8">
      <h1 className="my-6 text-center text-5xl font-bold text-nowrap">
        🎲 Yatzy 🎲
      </h1>

      {message && (
        <p className="rounded-lg bg-red-200 p-4 text-center" role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        className="btn"
        disabled={creating}
        onClick={create}
      >
        {creating ? "Loading..." : "New game"}
      </button>
      <hr />
      <form className="flex gap-6" onSubmit={join}>
        <input
          className="flex-1 p-3 not-placeholder-shown:uppercase"
          placeholder="Enter lobby code"
          aria-label="Lobby code"
          autoComplete="off"
          spellCheck={false}
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <button type="submit" className="btn">
          Join
        </button>
      </form>

      {error && (
        <p className="fixed top-4 left-4 rounded-lg bg-danger/70 p-4 text-white">
          ⚠️ {error}
        </p>
      )}
    </main>
  );
}

export default MainMenu;
