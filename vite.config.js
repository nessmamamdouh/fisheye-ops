import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-oxc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    allowedHosts: ['headlamp-applause-salad.ngrok-free.dev'],
  },
})