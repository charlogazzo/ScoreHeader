import { useCallback, useEffect, useState } from 'react';
import type { InitResponse, SubmitScoreResponse } from '../../shared/api';

type HeaderGameState = {
  username: string | null;
  highScore: number;
  loading: boolean;
};

export function useHeaderGame() {
  const [state, setState] = useState<HeaderGameState>({
    username: null,
    highScore: 0,
    loading: true,
  });
  const [postId, setPostId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        if (data.type !== 'init') throw new Error('Unexpected response');
        setState({
          username: data.username,
          highScore: data.highScore,
          loading: false,
        });
        setPostId(data.postId);
      } catch (err) {
        console.error('Failed to init game', err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
    void init();
  }, []);

  const submitScore = useCallback(
    async (score: number) => {
      if (!postId) return;
      try {
        const res = await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SubmitScoreResponse = await res.json();
        setState((prev) => ({
          ...prev,
          highScore: Math.max(prev.highScore, data.highScore),
        }));
      } catch (err) {
        console.error('Failed to submit score', err);
      }
    },
    [postId]
  );

  return { ...state, submitScore };
}
