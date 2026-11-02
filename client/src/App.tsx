import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import GamePage from "./pages/GamePage.tsx";
import HomePage from "./pages/HomePage.tsx";
import LobbyPage from "./pages/LobbyPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
