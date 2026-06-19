# Contributing to NeuroLex

Thanks for your interest in contributing! This guide covers how to set up the
project, propose changes, and submit pull requests.

## Code of Conduct

Be respectful and constructive. Harassment or discrimination of any kind will
not be tolerated.

## Getting Started

1. **Fork** the repository and **clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/NeuroLex.git
   cd NeuroLex
   ```
2. Follow the setup steps in the [README](./README.md#-getting-started).
3. Copy the example env files and fill in your own credentials:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

## Development Workflow

1. Create a feature branch off `main`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Make your changes. Keep commits focused and write clear messages.
3. Verify your changes:
   - **Backend:** `python3.10 manage.py runserver` starts without errors.
   - **Frontend:** `npm run build` completes with no type or lint errors.
4. Push your branch and open a Pull Request against `main`.

## Pull Request Guidelines

- Describe **what** changed and **why**.
- Reference any related issues (e.g. `Closes #12`).
- Keep PRs small and focused where possible.
- Do not commit secrets, `.env` files, `node_modules/`, build artifacts, or
  large binaries.

## Coding Standards

- **Python:** follow PEP 8; keep functions small and well-named.
- **TypeScript/React:** follow the existing component patterns; run `npm run lint`.
- Prefer clear, self-documenting code over clever one-liners.

## Reporting Bugs / Requesting Features

Open a GitHub Issue with:
- A clear title and description.
- Steps to reproduce (for bugs) and expected vs actual behavior.
- Environment details (OS, Python/Node versions).

## Security

Never include real API keys, database credentials, or other secrets in code,
commits, or issues. If you discover a security vulnerability, please report it
privately rather than opening a public issue.
