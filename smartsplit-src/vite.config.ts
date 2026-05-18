import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed under https://justmonikangel.github.io/smartsplit/ alongside the
// Cyster PCOS SPA. HashRouter is used so GitHub Pages doesn't need an SPA
// fallback file.
export default defineConfig({
  base: '/smartsplit/',
  plugins: [react()],
})
