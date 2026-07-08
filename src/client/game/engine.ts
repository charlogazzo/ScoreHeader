import {
  evaluateHeader,
  ROUNDS_PER_GAME,
  type AimDirection,
  type BallSide,
} from '../../shared/game';

export type GamePhase =
  | 'ready'
  | 'countdown'
  | 'flying'
  | 'result'
  | 'finished';

export type Vec2 = { x: number; y: number };

export type GameConfig = {
  width: number;
  height: number;
  /** Time for ball to reach the player head (ms). */
  flightDurationMs: number;
};

export type GameSnapshot = {
  phase: GamePhase;
  countdown: number;
  ballSide: BallSide;
  aim: AimDirection;
  ball: Vec2;
  ballProgress: number;
  contactTimeMs: number;
  elapsedMs: number;
  playerJump: number;
  resultText: string;
  roundIndex: number;
  roundScore: number;
  sessionScore: number;
  lastScored: boolean;
};

const DEFAULT_CONFIG: GameConfig = {
  width: 400,
  height: 640,
  flightDurationMs: 2400,
};

export function createGameConfig(
  width: number,
  height: number
): GameConfig {
  return { ...DEFAULT_CONFIG, width, height };
}

function randomSide(): BallSide {
  return Math.random() < 0.5 ? 'left' : 'right';
}

function layout(config: GameConfig) {
  const { width, height } = config;
  return {
    goal: { x: width / 2, y: height * 0.14, w: width * 0.55, h: height * 0.12 },
    player: { x: width / 2, y: height * 0.72, headY: height * 0.66 },
    spawnLeft: { x: width * 0.06, y: height * 0.58 },
    spawnRight: { x: width * 0.94, y: height * 0.58 },
    headContact: { x: width / 2, y: height * 0.66 },
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Ball position along an arc from wing to player head. */
export function ballPosition(
  config: GameConfig,
  side: BallSide,
  progress: number
): Vec2 {
  const L = layout(config);
  const start = side === 'left' ? L.spawnLeft : L.spawnRight;
  const end = L.headContact;
  const t = easeInOut(Math.min(1, Math.max(0, progress)));
  const arcHeight = config.height * 0.08;
  const midX = (start.x + end.x) / 2;
  const midY = Math.min(start.y, end.y) - arcHeight;

  const x =
    (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * midX + t * t * end.x;
  const y =
    (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * midY + t * t * end.y;

  return { x, y };
}

export class HeaderGameEngine {
  private config: GameConfig;
  phase: GamePhase = 'ready';
  countdown = 3;
  ballSide: BallSide = 'left';
  aim: AimDirection = 'center';
  ballProgress = 0;
  elapsedMs = 0;
  contactTimeMs: number;
  playerJump = 0;
  resultText = '';
  roundIndex = 0;
  roundScore = 0;
  sessionScore = 0;
  lastScored = false;
  private countdownTimer = 0;
  private resultTimer = 0;
  private onRoundComplete?: (score: number, scored: boolean) => void;
  private onGameComplete?: (total: number) => void;

  constructor(config: GameConfig) {
    this.config = config;
    this.contactTimeMs = config.flightDurationMs;
  }

  setCallbacks(
    onRoundComplete: (score: number, scored: boolean) => void,
    onGameComplete: (total: number) => void
  ) {
    this.onRoundComplete = onRoundComplete;
    this.onGameComplete = onGameComplete;
  }

  resize(width: number, height: number) {
    this.config = createGameConfig(width, height);
    this.contactTimeMs = this.config.flightDurationMs;
  }

  startRound() {
    this.ballSide = randomSide();
    this.aim = 'center';
    this.ballProgress = 0;
    this.elapsedMs = 0;
    this.playerJump = 0;
    this.resultText = '';
    this.countdown = 3;
    this.countdownTimer = 0;
    this.phase = 'countdown';
  }

  setAim(direction: AimDirection) {
    if (this.phase === 'countdown' || this.phase === 'flying') {
      this.aim = direction;
    }
  }

  /** Returns timing delta (negative = early, positive = late). */
  header(): number | null {
    if (this.phase !== 'flying') return null;
    this.playerJump = 1;
    return this.elapsedMs - this.contactTimeMs;
  }

  update(dtMs: number) {
    switch (this.phase) {
      case 'countdown': {
        this.countdownTimer += dtMs;
        if (this.countdownTimer >= 800) {
          this.countdownTimer = 0;
          this.countdown -= 1;
          if (this.countdown <= 0) {
            this.phase = 'flying';
            this.elapsedMs = 0;
            this.ballProgress = 0;
          }
        }
        break;
      }
      case 'flying': {
        this.elapsedMs += dtMs;
        this.ballProgress = this.elapsedMs / this.contactTimeMs;
        if (this.playerJump > 0) {
          this.playerJump = Math.max(0, this.playerJump - dtMs * 0.004);
        }
        if (this.elapsedMs > this.contactTimeMs + 600) {
          this.resolveRound(this.elapsedMs - this.contactTimeMs);
        }
        break;
      }
      case 'result': {
        this.resultTimer += dtMs;
        if (this.resultTimer >= 1800) {
          this.roundIndex += 1;
          if (this.roundIndex >= ROUNDS_PER_GAME) {
            this.phase = 'finished';
            this.onGameComplete?.(this.sessionScore);
          } else {
            this.startRound();
          }
        }
        break;
      }
      default:
        break;
    }
  }

  resolveRound(timingDeltaMs: number) {
    if (this.phase !== 'flying') return;
    const result = evaluateHeader(this.ballSide, this.aim, timingDeltaMs);
    this.roundScore = result.totalScore;
    this.sessionScore += result.totalScore;
    this.lastScored = result.scored;
    this.phase = 'result';
    this.resultTimer = 0;

    if (result.scored) {
      this.resultText = `GOAL! +${result.totalScore}`;
    } else if (Math.abs(timingDeltaMs) > 450) {
      this.resultText = timingDeltaMs < 0 ? 'Too early!' : 'Too late!';
    } else if (!result.directionCorrect) {
      this.resultText = 'Wrong direction!';
    } else {
      this.resultText = `Close! +${result.totalScore}`;
    }

    this.onRoundComplete?.(result.totalScore, result.scored);
  }

  snapshot(): GameSnapshot {
    return {
      phase: this.phase,
      countdown: this.countdown,
      ballSide: this.ballSide,
      aim: this.aim,
      ball: ballPosition(this.config, this.ballSide, this.ballProgress),
      ballProgress: this.ballProgress,
      contactTimeMs: this.contactTimeMs,
      elapsedMs: this.elapsedMs,
      playerJump: this.playerJump,
      resultText: this.resultText,
      roundIndex: this.roundIndex,
      roundScore: this.roundScore,
      sessionScore: this.sessionScore,
      lastScored: this.lastScored,
    };
  }

  getConfig() {
    return this.config;
  }
}
