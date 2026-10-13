import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lab.css'
import LabApp, { readLabQuery } from './LabApp'

createRoot(document.getElementById('lab-root')!).render(
  <StrictMode>
    <LabApp initial={readLabQuery()} />
  </StrictMode>,
)
