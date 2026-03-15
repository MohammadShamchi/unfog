# unfog

Dump your thoughts. See them clearly.

![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=fff)
![React Flow](https://img.shields.io/badge/React%20Flow-12-ff0072)
![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1?logo=bun&logoColor=000)
![License MIT](https://img.shields.io/badge/License-MIT-5FE0C1)

An AI thinking partner that turns brain fog into visual clarity maps.
Describe a problem in any language, and AI generates a structured breakdown.
Edit the map, AI re-analyzes. Repeat until it clicks.

## Features

- Multi-round intake — AI asks follow-up questions before generating
- Typed nodes: Problem (red), Cause (amber), Solution (teal), Context (indigo)
- Ghost suggestions — "Have you considered...?" nodes that appear after analysis
- Focus mode — dim unrelated nodes, highlight the selected branch
- Canvas chat — conversational AI with full graph context
- Explore node — expand any node with 2-4 child nodes
- Multi-provider AI — Gemini, OpenAI, Claude, OpenRouter
- Synthesized sound design — Tone.js audio feedback for every interaction

## Quick Start

```bash
git clone https://github.com/MohammadShamchi/unfog.git
cd unfog
bun install
cp .env.example .env.local
bun dev
```

Open [localhost:3000](http://localhost:3000).

## AI Providers

Unfog supports multiple AI providers. Configure via the settings modal (`Cmd + ,`) or environment variables.

| Provider | Env Variable | Get API Key |
|----------|-------------|-------------|
| Gemini (default) | `GOOGLE_AI_API_KEY` | [ai.google.dev](https://ai.google.dev/) |
| OpenAI | via settings modal | [platform.openai.com](https://platform.openai.com/) |
| Anthropic | via settings modal | [console.anthropic.com](https://console.anthropic.com/) |
| OpenRouter | via settings modal | [openrouter.ai](https://openrouter.ai/) |

User-provided config in the settings modal takes precedence over environment variables.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Canvas | React Flow 12, Dagre (auto-layout) |
| State | Zustand 5 |
| Motion | Framer Motion 12 |
| Sound | Tone.js 15 |
| Runtime | Bun |

## Architecture

Three-zone editor: a 52px header, a 320px prompt panel (sidebar), and a React Flow canvas filling the remaining space. Nine Zustand stores manage canvas state, intake flow, ghost suggestions, focus mode, chat, undo/redo, settings, sound, and prompt history. All AI calls go through a provider adapter pattern that normalizes Gemini, OpenAI, Anthropic, and OpenRouter behind a single `generate()` interface.

See [CLAUDE.md](./CLAUDE.md) for a deep architectural dive.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Double-click | Edit node text |
| Backspace / Delete | Delete selected |
| `Cmd Z` | Undo |
| `Cmd Shift Z` | Redo |
| `F` | Focus on selected branch |
| `Escape` | Exit focus mode |
| `?` | Show shortcuts |
| `Cmd ,` | AI Settings |

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Run `bun dev` and verify your changes
4. Open a pull request

## License

[MIT](./LICENSE) — Mohammad Shamchi
