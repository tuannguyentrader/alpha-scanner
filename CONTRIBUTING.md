# Contributing to Alpha Scanner

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# 1. Fork the repo on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/alpha-scanner.git
cd alpha-scanner

# 3. Install dependencies
npm install

# 4. Set up environment
cp .env.example .env

# 5. Set up database
npx prisma generate
npx prisma db push

# 6. Start dev server
npm run dev
```

## Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or: fix/bug-description, docs/what-changed, refactor/area
   ```

2. **Make your changes** — keep commits focused and atomic

3. **Verify the build passes**:
   ```bash
   npm run build
   ```

4. **Push and open a PR** against `main`:
   ```bash
   git push origin feat/your-feature
   ```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring (no behavior change) |
| `chore:` | Build, CI, dependency updates |
| `style:` | Formatting, whitespace (no logic change) |
| `perf:` | Performance improvements |
| `test:` | Adding or updating tests |

**Examples:**
- `feat: add RSI divergence detection`
- `fix: handle CoinGecko 429 rate limit`
- `docs: update deployment guide for Railway`

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **Components** — PascalCase (`SignalPanel.tsx`), one component per file
- **Hooks** — `use` prefix (`useSignals.ts`)
- **API routes** — kebab-case paths (`/api/webhook/configure`)
- **Tailwind** — utility-first, use the Ethereal Glass design tokens from `globals.css`
- **No inline styles** — use Tailwind classes or CSS modules

## Issue Labels

| Label | Description |
|---|---|
| `bug` | Something isn't working |
| `enhancement` | New feature or improvement |
| `good first issue` | Great for newcomers |
| `help wanted` | Community help appreciated |
| `documentation` | Docs improvements |
| `performance` | Speed / optimization |

## Project Structure

```
alpha-scanner/
├── app/
│   ├── api/          # API routes (signals, prices, auth, etc.)
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities (signal engine, TA, types)
│   ├── auth/         # Auth pages (signin, register)
│   ├── accuracy/     # Signal accuracy page
│   ├── backtest/     # Backtesting page
│   ├── leaderboard/  # Leaderboard page
│   └── feed/         # Signal feed + RSS
├── prisma/           # Database schema
├── public/           # Static assets, PWA files
└── docs/             # Documentation
```

## Guidelines

- **Don't break the build** — always run `npm run build` before pushing
- **Keep PRs focused** — one feature or fix per PR
- **Write descriptive PR titles** — they become commit messages on merge
- **Update docs** if your change affects user-facing behavior
- **Be kind** — follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Need Help?

- Open a [Discussion](https://github.com/naimkatiman/alpha-scanner/discussions) for questions
- Check existing [Issues](https://github.com/naimkatiman/alpha-scanner/issues) before filing a new one
- Tag `@naimkatiman` for urgent reviews

Thank you for making Alpha Scanner better! ⚡
