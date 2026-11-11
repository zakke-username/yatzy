import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const SERVER_URL = "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": SERVER_URL,
      "/socket.io": { target: SERVER_URL, ws: true },
    },
  },
});
