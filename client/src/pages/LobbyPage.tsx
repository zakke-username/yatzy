import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import LobbyInvite from '../components/LobbyInvite.tsx'
import NameDialog from '../components/NameDialog.tsx'
import PlayerList from '../components/PlayerList.tsx'
import { useLobby } from '../hooks/useLobby.ts'
import { joinLobby } from '../lib/api.ts'
import { loadSession } from '../lib/session.ts'
import './LobbyPage.css'

function LobbyPage() {
  const lobbyId = useParams().lobbyId!.toUpperCase()
  const navigate = useNavigate()
  const [session, setSession] = useState(() => loadSession(lobbyId))
  const { lobby, leave } = useLobby(session)

  // No token for this lobby in this tab yet, so join as a new player
  if (!session) {
    return (
      <NameDialog
        title="Join game"
        submitLabel="Join"
        onSubmit={async (name) => setSession(await joinLobby(lobbyId, name))}
        onCancel={() => navigate('/')}
      />
    )
  }

  if (!lobby) {
    return (
      <main className="page">
        <p className="muted">Connecting…</p>
      </main>
    )
  }

  return (
    <main className="page">
      <LobbyInvite lobbyId={lobby.id} />
      <PlayerList lobby={lobby} playerId={session.playerId} />

      {lobby.hostId === session.playerId ? (
        <button type="button" className="button">
          Start game
        </button>
      ) : (
        <p className="waiting">Waiting for host to start the game…</p>
      )}

      <button type="button" className="leave" onClick={leave}>
        Leave lobby
      </button>
    </main>
  )
}

export default LobbyPage
