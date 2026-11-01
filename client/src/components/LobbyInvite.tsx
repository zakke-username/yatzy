import { useState } from 'react'
import './LobbyInvite.css'

type Props = {
  lobbyId: string
}

function LobbyInvite({ lobbyId }: Props) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/l/${lobbyId}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The clipboard needs a secure context (https or localhost); the link can still be copied by hand
    }
  }

  return (
    <section className="stack">
      <h1 className="label">Lobby code</h1>
      <p className="lobby-code">{lobbyId}</p>
      <div className="row invite">
        <input
          className="input"
          aria-label="Invite link"
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
        />
        <button type="button" className="button" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </section>
  )
}

export default LobbyInvite
