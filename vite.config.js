import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Ignora la carpeta de compilación de Tauri para evitar el error EBUSY
      ignored: ["**/src-tauri/target/**"],
    },
  },
});