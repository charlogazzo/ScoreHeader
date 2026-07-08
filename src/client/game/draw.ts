import type { AimDirection } from '../../shared/game';
import type { GameSnapshot } from './engine';

type Layout = {
  goal: { x: number; y: number; w: number; h: number };
  player: { x: number; y: number; headY: number };
};

function layout(width: number, height: number): Layout {
  return {
    goal: { x: width / 2, y: height * 0.14, w: width * 0.55, h: height * 0.12 },
    player: { x: width / 2, y: height * 0.72, headY: height * 0.66 },
  };
}

function drawPitch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a6b2e');
  grad.addColorStop(1, '#2d8a45');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.55, w * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, h * 0.48, w, h * 0.52);
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  goal: Layout['goal']
) {
  const { x, y, w, h } = goal;
  const left = x - w / 2;
  const top = y;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(left, top + h);
  ctx.lineTo(left, top);
  ctx.lineTo(left + w, top);
  ctx.lineTo(left + w, top + h);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const nx = left + (w / 6) * i;
    ctx.beginPath();
    ctx.moveTo(nx, top);
    ctx.lineTo(nx, top + h);
    ctx.stroke();
  }
  for (let i = 1; i < 4; i++) {
    const ny = top + (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(left, ny);
    ctx.lineTo(left + w, ny);
    ctx.stroke();
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  jump: number,
  aiming: AimDirection
) {
  const { x, y, headY } = L.player;
  const jumpOffset = jump * 18;
  const headX = x + (aiming === 'left' ? -8 : aiming === 'right' ? 8 : 0);

  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.arc(headX, headY - jumpOffset, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e63946';
  ctx.fillRect(x - 22, y - 40 - jumpOffset, 44, 50);

  ctx.fillStyle = '#1d3557';
  ctx.fillRect(x - 10, y + 10 - jumpOffset, 8, 36);
  ctx.fillRect(x + 2, y + 10 - jumpOffset, 8, 36);

  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 20 - jumpOffset);
  ctx.lineTo(x - 28, y - 32 - jumpOffset);
  ctx.moveTo(x + 14, y - 20 - jumpOffset);
  ctx.lineTo(x + 28, y - 32 - jumpOffset);
  ctx.stroke();
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
    ctx.stroke();
  }
}

function drawAimArrow(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  aim: AimDirection
) {
  if (aim === 'center') return;
  const { x, headY } = L.player;
  const dir = aim === 'left' ? -1 : 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, headY - 30);
  ctx.lineTo(x + dir * 40, headY - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * 40, headY - 30);
  ctx.lineTo(x + dir * 30, headY - 38);
  ctx.lineTo(x + dir * 30, headY - 22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
}

function drawSideIndicator(
  ctx: CanvasRenderingContext2D,
  w: number,
  side: 'left' | 'right'
) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  ctx.fillText(
    side === 'left' ? '← Ball incoming' : 'Ball incoming →',
    side === 'left' ? 16 : w - 16,
    36
  );
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  width: number,
  height: number
) {
  const L = layout(width, height);
  drawPitch(ctx, width, height);
  drawGoal(ctx, L.goal);
  drawSideIndicator(ctx, width, snapshot.ballSide);

  if (snapshot.phase === 'flying' || snapshot.phase === 'result') {
    drawBall(ctx, snapshot.ball.x, snapshot.ball.y);
  }

  drawAimArrow(ctx, L, snapshot.aim);
  drawPlayer(ctx, L, snapshot.playerJump, snapshot.aim);

  if (snapshot.phase === 'countdown' && snapshot.countdown > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(snapshot.countdown), width / 2, height / 2);
  }

  if (snapshot.phase === 'result' && snapshot.resultText) {
    ctx.fillStyle = snapshot.lastScored
      ? 'rgba(46, 125, 50, 0.85)'
      : 'rgba(183, 28, 28, 0.85)';
    ctx.fillRect(width * 0.1, height * 0.38, width * 0.8, 56);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(snapshot.resultText, width / 2, height * 0.38 + 28);
  }
}
