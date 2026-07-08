import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { context } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-5 bg-[#0d2818] px-6">
      <div className="text-6xl" aria-hidden>
        ⚽
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-center text-white">
          Score Header
        </h1>
        <p className="text-base text-center text-green-200/90 max-w-xs">
          Crosses fly in from the wings. Time your header and aim into the net.
        </p>
      </div>
      <ul className="text-sm text-green-100/80 space-y-1 text-center">
        <li>Ball comes from the left or right</li>
        <li>Tap HEADER when it reaches the player</li>
        <li>Pick aim to redirect into the goal</li>
      </ul>
      <button
        type="button"
        className="flex items-center justify-center bg-[#d93900] text-white h-12 rounded-full cursor-pointer transition-colors px-8 font-bold text-lg hover:bg-[#c23300] mt-2"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Play Now
      </button>
      <p className="text-xs text-green-300/50 absolute bottom-4">
        {context.username ? `u/${context.username}` : 'Reddit Devvit Game'}
      </p>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
