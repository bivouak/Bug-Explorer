import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BugExplorer from "./BugExplorer.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BugExplorer/>
  </StrictMode>,
)
