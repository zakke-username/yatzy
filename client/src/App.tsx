import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import MainMenu from "./pages/MainMenu.tsx";
import Room from "./pages/Room.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
