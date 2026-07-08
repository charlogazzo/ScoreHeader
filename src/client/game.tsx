import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HeaderGame } from './components/HeaderGame';
import { useHeaderGame } from './hooks/useHeaderGame';

export const App = () => {
  const { username, highScore, loading, submitScore } = useHeaderGame();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d2818] text-white">
        <p className="text-lg animate-pulse">Loading pitch…</p>
      </div>
    );
  }

  return (
    <HeaderGame
      username={username}
      highScore={highScore}
      onSubmitScore={submitScore}
    />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
