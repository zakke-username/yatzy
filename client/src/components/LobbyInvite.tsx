import { useState } from "react";
import styles from "./LobbyInvite.module.css";

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
    } catch {}
  }

  return (
    <div className={styles.invite}>
      <p>
        Lobby: <b>{roomId}</b>
      </p>
      <button type="button" className="button" onClick={copyLink}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

export default LobbyInvite;
