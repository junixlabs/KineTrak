import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './index.css'
import App from './App'
import { bootstrapAuth } from './store/auth'
import { bootstrapShare, bootstrapMapShare } from './store/share'
import { getShareToken, getMapShareToken } from './store/api'

const shareToken = getShareToken()
const mapToken = getMapShareToken()
if (shareToken) {
  // Anonymous read-only viewer; fall back to the normal app if the link is bad.
  void bootstrapShare(shareToken).then((ok) => {
    if (!ok) void bootstrapAuth()
  })
} else if (mapToken) {
  void bootstrapMapShare(mapToken).then((ok) => {
    if (!ok) void bootstrapAuth()
  })
} else {
  void bootstrapAuth()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
