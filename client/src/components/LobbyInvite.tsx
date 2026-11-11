import { useState } from "react";
import "./LobbyInvite.css";

type Props = {
  roomId: string;
};

function LobbyInvite({ roomId }: Props) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/lobby/${roomId}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The clipboard needs a secure context (https or localhost); the link can still be copied by hand
    }
  }

  return (
    <section className="stack">
      <h1 className="label">Lobby</h1>
      <div className="row invite">
        {/* <input
          className="input"
          aria-label="Invite link"
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
        /> */}
        <h1 className="lobby-code">{roomId}</h1>
        <button type="button" className="button" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </section>
  );
}

export default LobbyInvite;
