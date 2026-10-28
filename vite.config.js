import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// The build uses relative paths ('./assets/…') so it works from any folder under
// C:\wamp64\www; index.php fills in the real folder when it serves the page.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
}))
