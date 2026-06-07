import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// ייבוא המשקלים של הפונט שהתקנו מקומית (רגיל, חצי-שמן, שמן, ומשקל כבד ללוגו)
import '@fontsource/assistant/400.css';
import '@fontsource/assistant/500.css';
import '@fontsource/assistant/600.css';
import '@fontsource/assistant/700.css';
import '@fontsource/assistant/800.css';
//import '@fontsource/assistant/900.css';

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)