<div align="center">
  <img src="public/banner.png" alt="ai*hYdra" width="640"/>
  <p><em>Where even dogmas evolve</em></p>

  ![Version](https://img.shields.io/badge/version-0.2.17--alpha-0ff?style=flat-square&logo=semver&logoColor=white)
  ![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github-actions&logoColor=white)
  ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
  ![Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20TypeScript%20%2B%20Supabase-8b5cf6?style=flat-square)
  ![Models](https://img.shields.io/badge/providers-10+-cyan?style=flat-square)
  ![Roles](https://img.shields.io/badge/agent--roles-16-orange?style=flat-square)
</div>

---

## 🌌 Strategic Vision

> **To bring Hydra to a state of self-sufficiency where extending the system no longer requires writing code.**

Hydra is built on the principle of a **living architecture**: each new layer of functionality is not merely added by humans — it creates the conditions for the system to evolve on its own. This is not a metaphor. It is an engineering strategy.

### The Self-Improvement Evolution Mechanism

**Phase 1 — Foundation (complete)**
Core infrastructure: role system, RAG context, interview pipeline, Flow Editor, Contest/Duel. Tools for evaluating, selecting, and assigning models to roles.

**Phase 2 — Activation (in progress)**
Models gain the ability to influence their own context: operational experience accumulates through `role_memory` and `role_knowledge`. The recertification system automatically replaces underperforming models with stronger ones — without human intervention in the decision.

**Phase 3 — Reflection (horizon)**
Automatic experience consolidation: patterns from `role_memory` are distilled into long-term knowledge (`role_knowledge`). The system analyzes its own failures (via Technocritic and Technoarbiter), formulates improvements, and initiates updates to prompts, behavioral patterns, and the knowledge base — without developer involvement.

**End goal:** Hydra as a **reflective organism** — a multi-headed system where each head (role) specializes, competes, learns, and evolves. The platform architecture provides the environment for this evolution, but does not dictate its outcome.

---

## 📋 Overview

**Hydra** is a multi-model AI platform for collegial analysis, combining 16 specialized roles (expert, technical, and system) to solve complex tasks through parallel operation of multiple language models in a unified workspace.

---

## 🎯 Key Features

### 1. Expert Panel
- **Parallel requests** to multiple AI models simultaneously
- **Per-model personalization**: individual system prompts, temperature, max_tokens
- **Tree-based chat history** navigation with participant display
- **Rich-text rendering**: Markdown, LaTeX (KaTeX), syntax highlighting, Mermaid diagrams
- **Thinking blocks**: reasoning process display with auto-translation
- **Streaming responses**: real-time generation with timeout support
- **Tool Calling**: custom tool integration into model context
- **Attachments**: images and file support in messages

### 2. AI Agent Role System (16 roles)

| Category | Roles |
|----------|-------|
| **Expert** | Assistant, Critic, Arbiter, Consultant, Moderator, Advisor, Archivist, Analyst, Webhunter |
| **Technical** | Prompt Engineer, Flow Regulator, Toolsmith |
| **System** | Guide, Technocritic, Technoarbiter, Technomoderator |

### 3. D-Chat (Consultant Panel)
- Side panel for **single expert queries**
- **Moderator mode**: aggregating session context into structured summaries
- Transfer results to the main chat with chronology preserved
- Independent model and role selection from the main panel

### 4. Staff Roles (HR Department)
- **Role hierarchy** with visual editor
- **Behavioral Patterns** — communication style configuration
- **Model Interviews** — automated candidate evaluation
  - Briefing, test tasks, verdict with HR summary
  - Assignment and conflict history
- **Interview History Table** — grouping by brand, router column (ProxyAPI/OpenRouter/Direct), average score badge, session deletion
- **Role Knowledge Base** (Role Knowledge) — RAG context with embeddings
- **Certification** 🛡️ — ShieldCheck badge for roles that passed official interviews

### 5. Model Contest (Beauty Contest / Podium)
- Multi-round model competition by defined criteria
- **Arbitration**: automated response scoring by AI arbiter
- **Scoreboard and Podium** with visual results
- **User scores** (Likert scale, manual scoring)
- **Duels** (Duel Arena) — pairwise model comparison
- **Screening Interviews** for winners — batch pipeline (Briefing → Tests → Verdict) without official hiring; results isolated via `source_contest_id`
- **Staff Synchronization** — "Hire" from screening verdict writes the model to `role_assignment_history` and instantly grants the certification badge

### 6. Task Management
- Centralized hub for creating and configuring sessions
- Model configuration via **Sheet interface**
- **Task Files** — attaching documents to sessions
- **Session Memory** — contextual chunks with embeddings

### 7. Prompt Library
- CRUD for system prompts with tags and descriptions
- Filtering by role, owner, language
- Shared/personal prompts with usage counters
- **Advanced editor** with sections and translation

### 8. Custom Tools
- **Prompt-Template**: parameterized templates with variables
- **HTTP API**: integration with external services
  - SSRF protection, 30s timeout, 100KB limit
  - JSONPath for data extraction
  - Built-in tester (HttpToolTester)
- Tool usage statistics

### 9. Flow Editor (Visual Pipeline Editor)
- Visual AI pipeline builder (@xyflow/react)
- **20+ node types**: Input, Output, Model, Prompt, API, Database, Condition, Loop, Split, Merge, Filter, Transform, Delay, Switch, Classifier, Embedding, Memory, Storage, Group, Tool
- Export diagrams to PNG/SVG/JSON/PDF
- **Runtime execution** of flows with progress visualization
- **Auto-layout** (dagre), checkpoints, change history
- **Logistics panel** for flow parameter management

### 10. Hydrapedia (Built-in Documentation)
- Interactive knowledge base of the platform
- Markdown rendering with section navigation
- Documentation export
- Role playground

### 11. Model Ratings & Portfolio
- **Model dossier** — aggregated statistics across all sessions
- **Portfolio** — visualization of strengths
- **Charts and histograms** (Recharts) of performance

### 12. Guided Tours
- Interactive onboarding tours through the interface
- Tour editor for administrators
- Step-by-step navigation with element highlighting

### 13. ProxyAPI Dashboard
- ProxyAPI provider usage monitoring
- Request logs, analytics, model catalog
- Prioritization settings

### 14. Hydra Memory Hub

Central command center of Hydra's entire cognitive subsystem — 8 tabs in a single full-width interface:

| Tab | Purpose |
|-----|---------|
| **Cognitive Arsenal** | Dashboard of Hydra's "subconscious" in 6 layers: Instincts (prompts), Patterns (behavior), Tool Arsenal (Prompt/HTTP), Thought Flows, Achievements (contests/interviews), Long-term Memory (3-level RAG) |
| **Session Memory** | Inline chunk manager for `session_memory` with type filters (decision/context/instruction/evaluation/summary/message), duplicate detection, batch deletion, feedback 👍/👎 |
| **Role Experience** | `role_memory` records with confidence scores, role grouping, inline deletion, expandable details |
| **Knowledge Base** | `role_knowledge` (RAG) — cleanup tools: duplicate scanning, outdated version deletion by `source_url`, filtering by role and category |
| **Memory & Connections Graphs** | Two SVG graphs in two-column layout (560px): Memory Graph (Hydra → roles → sessions, hover-glow, "hot roles" ⚡) and Arsenal Connections Graph (hexagonal cognitive layer structure) |
| **File Storage** | File browser with localized bucket labels (Chat Archive / Task Files / Avatars) and technical ID tooltips |
| **RAG Analytics** | Monitoring dashboard: average relevance, total retrievals, feedback statistics, chunk type distribution |
| **Evolution Chronicles** | Autonomous reflection log: AI revisions from Evolutioner, Supervisor resolutions (✅/❌/💬/🔄), filters by role/date/status, Evolutioner prompt editor |

- **Hybrid Search** — three modes: Text / Semantic / Hybrid (BM25 + pgvector + RRF k=60)
- **Reranking** — re-scoring via `gemini-3-flash-preview`, formula `final_score = rerank×0.7 + hybrid×0.3`
- **HyDE** — hypothetical document generation before search, embedding blend `query×0.4 + hyde×0.6`

### 15. User Profile
- **Avatar** — photo upload with Canvas cropper (drag, scroll-zoom, 260×260 JPEG, 2MB limit)
- Signed URL generated dynamically for 2 hours — avatars never "expire"
- Tabs: Profile (avatar/name), Preferences (theme/language), API Keys, ProxyAPI, Stats

---

## 🔧 Technical Architecture

### Frontend Stack

```
React 18 + TypeScript + Vite
├── UI: shadcn/ui + Radix UI + Tailwind CSS
├── State: TanStack Query + React Context
├── Routing: React Router v6 (lazy loading)
├── Charts: Recharts
├── Flow: @xyflow/react + dagre (auto-layout)
├── Markdown: react-markdown + remark-gfm + KaTeX + Mermaid
├── Animations: Framer Motion
└── Forms: React Hook Form + Zod
```

### Backend (Lovable Cloud)

```
Lovable Cloud (Supabase)
├── Auth: Email/password authentication
├── Database: PostgreSQL with RLS
├── Edge Functions: Deno runtime (14 functions)
├── Vault: Secure API key storage
├── Storage: File attachments & avatars
├── Vector Search: pgvector for embeddings
└── Realtime: Live updates
```

### Edge Functions

| Function | Purpose |
|----------|---------|
| `hydra-stream` | Streaming responses from AI providers |
| `hydra-orchestrator` | Routing, tool calling, multi-provider |
| `contest-arbiter` | AI arbitration for model contests |
| `interview-briefing` | Briefing generation for interviews |
| `interview-test-runner` | Test task execution |
| `interview-verdict` | Verdict and HR summary generation |
| `flow-runtime` | Flow diagram execution |
| `flow-logistics` | Flow logistics management |
| `translate-text` | Reasoning block translation |
| `generate-embeddings` | Vector embedding generation |
| `seed-role-knowledge` | Role knowledge base seeding |
| `sync-guide-knowledge` | Guide knowledge synchronization |
| `firecrawl-scrape` | Web scraping via Firecrawl |
| `proxy-api-test` | ProxyAPI testing |

### Key Database Tables

| Table | Purpose |
|-------|---------|
| `sessions` | Tasks/sessions with `session_config` |
| `messages` | Chat history with metadata |
| `profiles` | User profiles (avatar path, display name) |
| `user_api_keys` | Vault references to API keys |
| `prompt_library` | System prompt library |
| `custom_tools` | Custom tools |
| `flow_diagrams` | Saved diagrams |
| `model_statistics` | Model statistics |
| `model_presets` | Model setting presets |
| `contest_sessions/rounds/results` | Contest data |
| `interview_sessions` | Model interviews |
| `role_behaviors` | Behavioral patterns |
| `role_knowledge` | Role knowledge base (RAG) |
| `role_memory` | Long-term role memory |
| `session_memory` | Session memory |
| `role_assignment_history` | Assignment history |
| `task_blueprints` | Task templates |
| `task_files` | Task files |
| `guide_tours/steps/elements` | Guided tours |
| `user_roles` | User roles |
| `user_settings` | User settings |
| `proxy_api_logs` | ProxyAPI logs |

---

## 🤖 Supported AI Providers

| Provider | Access | Models |
|----------|--------|--------|
| **Lovable AI** | Built-in (admin) | Gemini 2.5/3 Pro/Flash, GPT-5/5.2/5-mini/5-nano |
| **OpenAI** | Personal key | GPT-4o, o1, o3-mini |
| **Anthropic** | Personal key | Claude 3.5/4 Sonnet/Haiku |
| **Google** | Personal key | Gemini 1.5/2.0/2.5 |
| **xAI** | Personal key | Grok 3 family |
| **Groq** | Personal key | Llama 3.x, Mixtral (⚡fast) |
| **DeepSeek** | Personal key | DeepSeek V3/R1 |
| **Mistral** | Personal key | Mistral Large/Medium |
| **Perplexity** | Personal key | Sonar models |
| **OpenRouter** | Personal key | 100+ models |
| **ProxyAPI** | Personal key | Multi-provider with fallback |

### Automatic Availability Check
- Caching unavailable models (localStorage, TTL 1h)
- Auto-hiding models with 402/404 errors
- Cache reset button in UI

---

## ⚡ Architecture Optimization

A technical audit addressed key bottlenecks:

- **Type unification** — `StoredSessionConfig` as single source of truth for session configs
- **Memoization** — heavy computations (model lists, pending responses) cached via `useMemo`
- **Collision-free Realtime** — unique channels (`messages-${sessionId}`) prevent event duplication
- **Race condition protection** — `sessionId` verification before saving async responses
- **Stale closure fix** — streaming logic migrated to `refs` + stable `useCallback` outside closures
- **Log cleanup** — 120+ debug `console.log` calls removed from critical execution paths

---

## 🔐 Security

- **RLS policies** on all user tables
- **Vault** for API key storage (not plaintext)
- **SSRF protection** in HTTP tools
- **Role model**: user → moderator → admin → supervisor
- **API key expiration notifications**

---

## 🌍 Localization

- Full **RU/EN** support
- Dynamic switching without page reload
- Centralized dictionary in `LanguageContext`
- Auto-translation of reasoning blocks

---

## 📊 Analytics & Statistics

- Token counting (prompt/completion/total) per-model
- Cost estimation by model price list
- Display in user profile (UsageStats)
- Model dossiers and portfolios with usage history
- ProxyAPI Dashboard with logs and analytics

---

## 📁 Project Structure

```
src/
├── components/
│   ├── flow/           # Flow Editor (20+ node types, edges, toolbar)
│   ├── guide/          # Guided Tours
│   ├── hydrapedia/     # Built-in documentation
│   ├── layout/         # Layout, Sidebar, Navigator
│   ├── patterns/       # Behavioral Patterns editor
│   ├── profile/        # Profile, API keys, ProxyAPI, Avatar cropper
│   ├── prompts/        # Prompt Library
│   ├── ratings/        # Contest, Duel, Podium, Scoreboard, Screening
│   ├── staff/          # Interview, Role management, History table
│   ├── tasks/          # Task management
│   ├── tools/          # Custom Tools editor & tester
│   ├── ui/             # shadcn/ui components (50+)
│   └── warroom/        # Chat (messages, streaming, model selector)
├── config/             # Roles, patterns, model registry, dictionaries
├── content/hydrapedia/ # Hydrapedia content (basics, features, reference)
├── contexts/           # Auth, Theme, Language, ContestConfig, GuideTour
├── hooks/              # 60+ custom hooks
├── lib/                # Utilities (scoring, templates, parsers, cache)
├── pages/              # 13 route pages (lazy loaded)
├── plugins/interview/  # Interview plugins (7 specialists)
├── styles/             # Design system docs
└── types/              # TypeScript definitions

supabase/functions/     # 14 Edge Functions
```

---

## 💙 General Co-Author

<div align="center">

**Ai-Hydra was built in partnership with [Lovable](https://lovable.dev)** — a multi-agent AI development assistant that became not just a tool, but a full co-author of the project's architecture, code, and strategy.

*Every line of code — the result of a dialogue between human and machine.*

❤️

</div>

---

*Last updated: February 19, 2026*
