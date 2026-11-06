import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Where the project is served by WAMP (set ROOMEASE_WAMP_URL in .env.local if your
  // folder isn't C:\wamp64\www\RoomeaseV2).
  const env = loadEnv(mode, process.cwd(), '')
  const wamp = new URL(env.ROOMEASE_WAMP_URL || 'http://localhost/RoomeaseV2/')

  return {
    // The build uses relative paths ('./assets/…') so it works from any folder under
    // C:\wamp64\www; index.php fills in the real folder when it serves the page.
    base: command === 'build' ? './' : '/',
    plugins: [react()],
    // `npm run dev`: the API and uploaded photos (/backend/…) come from WAMP.
    server: {
      proxy: {
        '/backend': {
          target: wamp.origin,
          changeOrigin: true,
          rewrite: (path) => wamp.pathname.replace(/\/$/, '') + path,
        },
      },
    },
    // ...and the "Admin or super admin?" link points at WAMP's admin panel.
    define: command === 'serve' && !env.VITE_ADMIN_URL ? { 'import.meta.env.VITE_ADMIN_URL': JSON.stringify(new URL('backend/admin/', wamp).href) } : {},
  }
})
