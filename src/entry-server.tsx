import { renderToString } from 'react-dom/server'
import { App } from './App.tsx'

/** The page as HTML, for the build-time prerender. Runs on Node, so no window or document. */
export function render(): string {
  return renderToString(<App />)
}
