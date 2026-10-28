// The path the website is served from: '/' with `npm run dev`, or the WAMP folder
// (e.g. '/RoomeaseV2/') for the built site. index.php writes it into this meta tag.
export const BASE_PATH = document.querySelector('meta[name="roomease-base"]')?.content || '/'

// A file from public/ (e.g. 'images/pages/about-header.webp') at the right address.
export const publicUrl = (path) => BASE_PATH + path.replace(/^\//, '')
