/*
 * Hanna / Quiet Command Center
 * The app shell stays intentionally small: the Home page owns the focused workspace
 * while the existing error boundary protects the interface during interaction.
 */
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}

export default App;
