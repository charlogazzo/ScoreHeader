import { useCallback, useEffect, useRef, useState } from 'react';
import type { AimDirection } from '../../shared/game';
import { ROUNDS_PER_GAME } from '../../shared/game';
import { HeaderGameEngine, createGameConfig } from '../game/engine';
import { drawFrame } from '../game/draw';

type HeaderGameProps = {
  username: string | null;
  highScore: number;
  onSubmitScore: (score: number) => Promise<void>;
};

export function HeaderGame({
  username,
  highScore,
  onSubmitScore,
}: HeaderGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HeaderGameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [aim, setAimState] = useState<AimDirection>('center');
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [isNewBest, setIsNewBest] = useState(false);

  const initEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const engine = new HeaderGameEngine(createGameConfig(rect.width, rect.height));
    engine.setCallbacks(
      () => {
        setSessionScore(engine.sessionScore);
        setRoundIndex(engine.roundIndex);
        setAimState(engine.aim);
      },
      async (total: number) => {
        setPhase('done');
        setSessionScore(total);
        setIsNewBest(total > highScore);
        if (!submittedRef.current) {
          submittedRef.current = true;
          await onSubmitScore(total);
        }
      }
    );
    engineRef.current = engine;
  }, [highScore, onSubmitScore]);

  useEffect(() => {
    initEngine();
    const onResize = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      engine.resize(rect.width, rect.height);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initEngine]);

  useEffect(() => {
    const loop = (time: number) => {
      const engine = engineRef.current;
      const canvas = canvasRef.current;
      if (engine && canvas) {
        const dt = lastTimeRef.current ? time - lastTimeRef.current : 0;
        lastTimeRef.current = time;
        engine.update(dt);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const snap = engine.snapshot();
          drawFrame(ctx, snap, canvas.width / dpr, canvas.height / dpr);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const startGame = () => {
    const engine = engineRef.current;
    if (!engine) return;
    submittedRef.current = false;
    setIsNewBest(false);
    setSessionScore(0);
    setRoundIndex(0);
    setAimState('center');
    setPhase('playing');
    engine.sessionScore = 0;
    engine.roundIndex = 0;
    engine.startRound();
  };

  const handleHeader = () => {
    const engine = engineRef.current;
    if (!engine || phase !== 'playing') return;
    const delta = engine.header();
    if (delta !== null) {
      engine.resolveRound(delta);
      setSessionScore(engine.sessionScore);
      setRoundIndex(engine.roundIndex);
    }
  };

  const setAim = (dir: AimDirection) => {
    engineRef.current?.setAim(dir);
    setAimState(dir);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0d2818] select-none touch-none">
      <header className="flex items-center justify-between px-4 py-2 bg-[#0a1f12] text-white shrink-0">
        <div>
          <p className="text-xs text-green-300/80 uppercase tracking-wide">
            Score Header
          </p>
          <p className="text-sm font-medium">
            {username ? `u/${username}` : 'Player'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-green-300/80">Best</p>
          <p className="text-lg font-bold tabular-nums">{highScore}</p>
        </div>
      </header>

      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onPointerDown={(e) => {
            e.preventDefault();
            if (phase === 'playing') handleHeader();
          }}
        />

        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
            <h2 className="text-2xl font-bold text-white">Score Header</h2>
            <p className="text-center text-green-100/90 px-8 text-sm max-w-sm">
              Time your header when the ball reaches the player. Choose left or
              right aim to redirect crosses into the goal.
            </p>
            <button
              type="button"
              onClick={startGame}
              className="bg-[#d93900] hover:bg-[#c23300] text-white font-bold px-8 py-3 rounded-full text-lg transition-colors"
            >
              Kick Off
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <h2 className="text-2xl font-bold text-white">Full Time!</h2>
            <p className="text-4xl font-bold text-[#f5c542] tabular-nums">
              {sessionScore} pts
            </p>
            {isNewBest && (
              <p className="text-green-400 font-semibold">New personal best!</p>
            )}
            <button
              type="button"
              onClick={startGame}
              className="mt-2 bg-[#d93900] hover:bg-[#c23300] text-white font-bold px-8 py-3 rounded-full transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {phase === 'playing' && (
        <footer className="shrink-0 bg-[#0a1f12] px-3 py-3 flex flex-col gap-2">
          <div className="flex justify-between text-white text-sm">
            <span>
              Round {Math.min(roundIndex + 1, ROUNDS_PER_GAME)}/{ROUNDS_PER_GAME}
            </span>
            <span className="tabular-nums">Score: {sessionScore}</span>
          </div>

          <p className="text-center text-xs text-green-300/70">
            Tap to header · Pick aim before the ball arrives
          </p>

          <div className="flex gap-2 justify-center">
            {(['left', 'center', 'right'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  setAim(dir);
                }}
                className={`flex-1 max-w-[120px] py-3 rounded-xl font-bold text-sm transition-colors ${
                  aim === dir
                    ? 'bg-[#f5c542] text-[#0a1f12]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {dir === 'left' ? '← Left' : dir === 'right' ? 'Right →' : 'Center'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleHeader();
            }}
            className="w-full py-4 bg-[#d93900] hover:bg-[#c23300] active:scale-[0.98] text-white font-bold text-xl rounded-xl transition-all"
          >
            HEADER!
          </button>
        </footer>
      )}
    </div>
  );
}
