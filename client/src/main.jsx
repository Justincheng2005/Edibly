import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from "@auth0/auth0-react";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
    domain="dev-iqtq0gf2e2rcheef.us.auth0.com"
    clientId="W25nLVSpoTrGsbt4Mf5f3GkDxO1u7PEm"
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://your-express-api",
    }}>
      <App />
    </Auth0Provider>
  </StrictMode>,
)
