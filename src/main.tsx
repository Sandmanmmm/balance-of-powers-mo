import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
// import "@github/spark/spark"

import App from './App'
// import ComponentTestApp from './ComponentTestApp.tsx'
// import MinimalGameApp from './MinimalGameApp.tsx'
// import DataLoadingTest from './DataLoadingTest.tsx'
// import RawImportTest from './RawImportTest.tsx'
// import DebugApp from './DebugApp.tsx'
// import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
