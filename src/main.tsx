import '@fontsource/geist/latin-400.css'
import '@fontsource/geist/latin-500.css'
import '@fontsource/geist/latin-600.css'
import '@fontsource/newsreader/latin-400.css'
import '@fontsource/newsreader/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing the #root element')

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The built page is prerendered, so attach to it; `vite dev` serves an empty root.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
