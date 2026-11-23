import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { createRoom } from "../lib/api.ts";

function MainMenu() {
  const navigate = useNavigate();
  const message = (useLocation().state as { message?: string } | null)?.message;
  const [error, setError] = useState("test error");
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
    <main className="card m-auto max-w-[min(24rem,100%-2rem)] flex flex-col justify-center gap-8">
      <h1 className="text-5xl my-6 font-bold text-center text-nowrap">
        🎲 Yatzy 🎲
      </h1>

      {message && (
        <p
          className="bg-red-200 p-4 rounded-lg text-red-700 text-center"
          role="status"
        >
          ⚠️ {message}
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
      {error && (
        <p className="fixed top-4 left-4 bg-red-600/70 text-white p-4 rounded-lg">
          ⚠️ {error}
        </p>
      )}
      <hr />
      <form className="flex gap-6" onSubmit={join}>
        <input
          className="flex-1 border-gray-400 border-2 p-3 rounded-lg not-placeholder-shown:uppercase"
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
    </main>
  );
}

export default MainMenu;
