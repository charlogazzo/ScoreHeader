# Score Header

A Reddit Devvit timing game: crosses fly in from the wings, you time your header and aim the ball into the net.

## How to play

1. The ball crosses in from the **left** or **right** side of the goal.
2. Pick an **aim direction** (left, center, or right) before the ball arrives.
3. Tap **HEADER!** (or tap the pitch) when the ball reaches the player's head.
4. Score points for precise timing and aiming the ball toward the goal.
5. Play **5 rounds** per match. Your best score is saved per Reddit user.

### Scoring tips

- Ball from the **left** → aim **right** to redirect into the goal.
- Ball from the **right** → aim **left**.
- Perfect timing earns up to 100 timing points; wrong aim costs you the goal.

## Setup

Requires **Node.js 22+**.

```bash
nvm use 22          # or ensure Node 22+ is active
npm install
npm run login       # connect Reddit developer account
```

### First-time: register the app on Reddit

This project was scaffolded locally, so you must link it to a Reddit Devvit app **once** before playtesting:

```bash
npx devvit init --force
```

1. The CLI prints a URL — open it in your browser (logged in as the same Reddit account as the CLI).
2. Confirm or create the app named **score-header** on [developers.reddit.com](https://developers.reddit.com/new).
3. When redirected back, the CLI finishes setup automatically.

Then start playtest:

```bash
npm run dev
```

If `devvit init` says the app name is taken or owned by another account, either log in with the owning account (`npm run login`) or pick a different app name in the wizard (the CLI updates `devvit.json` for you).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Devvit playtest |
| `npm run build` | Build client and server |
| `npm run deploy` | Upload a new version |
| `npm run launch` | Deploy and publish for review |

## Project structure

```
src/client/          # React UI + canvas game
  components/        # HeaderGame
  game/              # Engine + renderer
  hooks/             # useHeaderGame (score API)
src/server/          # Hono API (high scores via Redis)
src/shared/          # Types and scoring logic
```

Built with [Devvit Web](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview), React, Vite, and Tailwind CSS.
