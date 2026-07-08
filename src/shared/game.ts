export type BallSide = 'left' | 'right';

export type AimDirection = 'left' | 'center' | 'right';

export type RoundResult = {
  timingMs: number;
  timingScore: number;
  directionCorrect: boolean;
  directionScore: number;
  totalScore: number;
  scored: boolean;
  ballSide: BallSide;
  aim: AimDirection;
};

export type GameSession = {
  rounds: RoundResult[];
  totalScore: number;
};

export const ROUNDS_PER_GAME = 5;

/** Milliseconds from perfect contact that still counts as a header. */
export const TIMING_WINDOW_MS = 450;

/** Ideal direction to send the ball into the goal for each approach side. */
export const OPTIMAL_AIM: Record<BallSide, AimDirection> = {
  left: 'right',
  right: 'left',
};

export function scoreTiming(timingDeltaMs: number): number {
  const abs = Math.abs(timingDeltaMs);
  if (abs > TIMING_WINDOW_MS) return 0;
  return Math.round(100 - (abs / TIMING_WINDOW_MS) * 100);
}

export function scoreDirection(ballSide: BallSide, aim: AimDirection): number {
  if (aim === OPTIMAL_AIM[ballSide]) return 100;
  if (aim === 'center') return 55;
  return 0;
}

export function evaluateHeader(
  ballSide: BallSide,
  aim: AimDirection,
  timingDeltaMs: number
): RoundResult {
  const timingScore = scoreTiming(timingDeltaMs);
  const directionScore = scoreDirection(ballSide, aim);
  const directionCorrect = directionScore === 100;
  const scored = timingScore >= 60 && directionCorrect;
  const totalScore = Math.round(timingScore * 0.6 + directionScore * 0.4);

  return {
    timingMs: timingDeltaMs,
    timingScore,
    directionCorrect,
    directionScore,
    totalScore,
    scored,
    ballSide,
    aim,
  };
}
