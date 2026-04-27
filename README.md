# 🔍 FairLens — AI Behavioral Bias Auditor

> **"Probe the model. Not the training data."**

FairLens is an open-source platform for auditing bias in large language models (LLMs) through **behavioral probing** — a black-box, model-agnostic methodology that requires no dataset access, no model internals, and no white-box visibility.

---

## 📋 Table of Contents

- [Brief About the Solution](#-brief-about-the-solution)
- [Opportunities](#-opportunities)
- [Feature List](#-feature-list)
- [Process Flow & Use-Case Diagram](#-process-flow--use-case-diagram)
- [Architecture Diagram](#️-architecture-diagram)
- [Technologies Used](#-technologies-used)
- [Getting Started](#-getting-started)

---

## 💡 Brief About the Solution

FairLens is an **AI behavioral auditing platform** that detects bias in LLMs without requiring access to training data, model weights, or internal representations. It works by running **symmetric prompt pairs** — structurally identical prompts that differ only in a single demographic variable (e.g., a name, religion, or occupation) — and quantifying the asymmetry in the model's responses.

Each audit produces a **Bias Fingerprint**: a multi-dimensional score called the **Bias Signal Score (BSS)** that captures asymmetries across six dimensions — sentiment, tone, response length, hedging behavior, refusal patterns, and gender attribution. The platform covers six bias categories: **Political Leaning, Religious Treatment, Gender Defaults, Racial & Ethnic Framing, Cultural Hierarchy, and Socioeconomic Tone**.

Auditors interact with a clean, Apple-inspired interface, choose between a Quick Audit (6 representative probes) or a Full Audit (all available probe pairs), configure the target model, and receive a transparent, exportable report complete with scoring formulas, flags, caveats, and actionable remediation guidance.

---

## 🚀 Opportunities

### How is FairLens different from existing approaches?

| Dimension | Existing Tools | FairLens |
|---|---|---|
| **Audit Target** | Training datasets, model weights | Live model behavior (black-box) |
| **Access Required** | Dataset CSV, model internals | Only API access to the model |
| **Bias Detection Method** | Statistical group disparity on labels | Symmetric prompt pair comparison |
| **Applicable Models** | Typically the model being trained | Any deployed LLM (Gemini, GPT, etc.) |
| **Output** | Fairness metrics (demographic parity, etc.) | Bias fingerprint + per-probe flags |
| **Transparency** | Often a single scalar score | Full formulas, per-dimension breakdown |
| **Remediation** | Generic guidelines | Probe-specific, actionable fixes |
| **User Workflow** | Requires ML expertise | Accessible to auditors, journalists, policymakers |

Most fairness toolkits (IBM AI Fairness 360, Google What-If Tool, Fairlearn) operate **pre-deployment** on labeled datasets with ground truth. FairLens operates **post-deployment** on production models — the moment when bias matters most.

### How does it solve the problem?

Bias in an LLM is an emergent behavior of how the model responds, not only what it was trained on. Fine-tuning, RLHF, and system prompts all change a model's bias profile without changing the training data. FairLens catches these behavioral drifts by:

1. **Isolating the variable** — symmetric prompts ensure the only difference between two queries is the demographic signal (name, religion, occupation).
2. **Quantifying asymmetry** — six independent scoring dimensions capture different manifestations of bias (language choice, refusals, hedging).
3. **Providing evidence, not verdicts** — BSS scores come with the full response text, so auditors can read the actual outputs and judge for themselves.
4. **Closing the loop** — remediation guidance ties each flag to a concrete system-prompt fix, enabling engineers to retune and retest.

### USP of FairLens

> **The only behavioral bias auditing platform designed to work on any deployed LLM, without any dataset access, delivering a transparent, multi-dimensional Bias Signal Score with probe-level remediation guidance.**

- ✅ **Zero data dependency** — audit any model, anywhere, any time
- ✅ **Methodology transparency** — every formula is shown, every threshold is documented
- ✅ **Six-dimensional scoring** — not a single opacity number, but a structured fingerprint
- ✅ **Dual audit modes** — Quick Audit for rapid checks, Full Audit for comprehensive coverage
- ✅ **Exportable evidence** — PDF and JSON reports suitable for compliance, journalism, or research
- ✅ **Reproducible** — deterministic mode (temperature=0) ensures audits can be repeated and compared

---

## ✨ Feature List

### Core Audit Engine
- **Symmetric Probe Pairs** — 12+ curated probe pairs (expandable to 200+) organized across 6 bias categories
- **Quick Audit Mode** — 6 representative probes for a rapid bias fingerprint
- **Full Audit Mode** — all available probe pairs for comprehensive coverage
- **Multi-run averaging** — configurable `runsPerProbe` to handle non-deterministic model outputs
- **Offline/Dry-run mode** — test the scoring pipeline without API calls

### Scoring Engine
- **Bias Signal Score (BSS)** — composite 0–100 score per probe pair and per category
- **Sentiment Delta** — asymmetry in positive/negative word frequency
- **Tone Delta** — formality, warmth, and dismissiveness vector comparison
- **Length Asymmetry** — token-count ratio between paired responses
- **Hedge Asymmetry** — count of hedging phrases ("however", "may", "generally") per side
- **Refusal Asymmetry** — flags when a model refuses one side of a probe pair but not the other
- **Gender Attribution Delta** — pronoun distribution L1 distance across profession prompts

### Bias Categories
| # | Category | Focus |
|---|---|---|
| 1 | ⚖️ Political Leaning | Ideological asymmetry in framing, tone, disclaimers, effort |
| 2 | 🕌 Religious Treatment | Respect, depth, and willingness to discuss criticism across religions |
| 3 | 👤 Gender Defaults | Gender attribution and competence cues under neutral prompts |
| 4 | 🌍 Racial & Ethnic Framing | Assumptions about competence, criminality, character via coded names |
| 5 | 🗺️ Cultural Hierarchy | Othering, exotic framing, and unequal depth across cultures |
| 6 | 💰 Socioeconomic Tone | Judgment vs. dignity in descriptions of poverty/wealth and class-coded occupations |

### Dashboard & Reporting
- **Audit History** — persistent record of all past audits with timestamps
- **Per-probe response viewer** — side-by-side A/B response comparison with flag annotations
- **Category-level scores** — aggregated BSS per bias category
- **Severity classification** — Low / Medium / High risk thresholds
- **Remediation guidance** — probe-specific, actionable system-prompt fixes for each triggered flag
- **PDF export** — formatted audit report for compliance and sharing
- **JSON export** — machine-readable results for downstream analysis

### Platform & Auth
- **User authentication** — email/password via Lucia Auth + Google OAuth
- **Audit persistence** — results saved to PostgreSQL and tied to user accounts
- **Prompt library** — browsable catalog of all available probe pairs with rationale and tags
- **Methodology page** — transparent documentation of scoring formulas and thresholds
- **Responsive UI** — Apple-inspired design system, fully responsive across mobile and desktop

---

## 🔄 Process Flow & Use-Case Diagram

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐     ┌─────────────────┐
│             │     │                  FairLens Platform                │     │                 │
│   Auditor   │     │                                                  │     │  AI Model API   │
│             │     │                                                  │     │  (e.g. Gemini)  │
└──────┬──────┘     └──────────────────────────────────────────────────┘     └────────┬────────┘
       │                                                                               │
       │  1. Sign up / Log in                                                          │
       │─────────────────────────────────────────────────────►                        │
       │                                                                               │
       │  2. Configure Audit                                                           │
       │   • Select bias categories (Gender, Religion, …)                              │
       │   • Choose mode: Quick (6 probes) / Full (all probes)                        │
       │   • Enter Gemini API key & temperature (default: 0)                          │
       │─────────────────────────────────────────────────────►                        │
       │                                                                               │
       │  3. FairLens dispatches Probe Pair A                                         │
       │─────────────────────────────────────────────────────────────────────────────►│
       │                        Response A ◄───────────────────────────────────────── │
       │  4. FairLens dispatches Probe Pair B                                         │
       │─────────────────────────────────────────────────────────────────────────────►│
       │                        Response B ◄───────────────────────────────────────── │
       │                                                                               │
       │  5. Scoring Engine computes BSS per probe                                    │
       │     (Sentiment Δ, Tone Δ, Length Δ, Hedge Δ, Refusal Δ, Gender Δ)          │
       │                                                                               │
       │  6. Dashboard renders Bias Fingerprint                                        │
       │   • Overall BSS  • Per-category scores  • Flags                             │
       │   • Side-by-side response viewer  • Remediation guidance                    │
       │◄─────────────────────────────────────────────────────                        │
       │                                                                               │
       │  7. Export Report (PDF / JSON) & Save to Audit History                       │
       │◄─────────────────────────────────────────────────────                        │
```

### Use Cases

```
                    ┌─────────────────────────────────────┐
                    │            FairLens System           │
                    │                                      │
  ┌──────────┐      │  ┌──────────────────────────────┐   │
  │          │─────►│  │  UC1: Run Quick Audit         │   │
  │          │      │  └──────────────────────────────┘   │
  │          │      │  ┌──────────────────────────────┐   │
  │ Auditor  │─────►│  │  UC2: Run Full Audit          │   │
  │ / User   │      │  └──────────────────────────────┘   │
  │          │      │  ┌──────────────────────────────┐   │
  │          │─────►│  │  UC3: View Audit History      │   │
  │          │      │  └──────────────────────────────┘   │
  │          │      │  ┌──────────────────────────────┐   │
  │          │─────►│  │  UC4: Export Report (PDF/JSON)│   │
  └──────────┘      │  └──────────────────────────────┘   │
                    │  ┌──────────────────────────────┐   │
  ┌──────────┐      │  │  UC5: Browse Prompt Library   │   │
  │  Admin / │─────►│  └──────────────────────────────┘   │
  │Researcher│      │  ┌──────────────────────────────┐   │
  └──────────┘      │  │  UC6: Add / Manage Probe Pairs│   │
                    │  └──────────────────────────────┘   │
                    └─────────────────────────────────────┘
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser Client                              │
│                                                                      │
│   ┌────────────┐  ┌─────────────────┐  ┌────────────────────────┐  │
│   │  Landing   │  │  Behavioral     │  │  Audit History /        │  │
│   │  Page      │  │  Audit Config   │  │  Results Dashboard      │  │
│   │  /         │  │  /behavioral    │  │  /dashboard, /audits/id │  │
│   └────────────┘  └────────┬────────┘  └────────────────────────┘  │
│                             │                                        │
│   ┌────────────┐  ┌─────────▼────────┐  ┌────────────────────────┐  │
│   │  Auth      │  │  Prompt Library  │  │  Methodology Page      │  │
│   │  /login    │  │  /prompts        │  │  /methodology          │  │
│   │  /signup   │  └──────────────────┘  └────────────────────────┘  │
│   └────────────┘                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                                │  HTTPS / API Routes
┌──────────────────────────────▼──────────────────────────────────────┐
│                        Next.js App Router (Server)                   │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐│
│  │  Auth API       │  │  Datasets API   │  │  Audits API          ││
│  │  /api/auth/*    │  │  /api/datasets  │  │  /api/audits         ││
│  │  Lucia + Arctic │  │                 │  │  /api/behavioral-    ││
│  │  (Google OAuth) │  │                 │  │  audits              ││
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘│
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Behavioral Engine (lib/behavioral/)         │  │
│  │                                                               │  │
│  │  probes.ts          runner.ts           scoring.ts            │  │
│  │  ┌────────────┐    ┌─────────────┐    ┌──────────────────┐   │  │
│  │  │Probe Pairs │    │ Audit Runner│    │ Scoring Engine   │   │  │
│  │  │& Categories│───►│ (A/B loop)  │───►│ BSS Calculator   │   │  │
│  │  └────────────┘    └──────┬──────┘    └──────────────────┘   │  │
│  └─────────────────────────┼─┴───────────────────────────────────┘  │
│                             │                                        │
│  ┌──────────────────────────▼──────────────────────────────────────┐│
│  │              Data Layer (lib/prisma.ts + Prisma ORM)            ││
│  │    User  │  Session  │  Dataset  │  AuditResult                 ││
│  └──────────────────────┬──────────────────────────────────────────┘│
└─────────────────────────┼───────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────▼──────┐ ┌───────▼──────┐ ┌──────▼────────────┐
│  PostgreSQL    │ │  Gemini API  │ │  Google OAuth 2.0  │
│  (Neon /       │ │  (Generative │ │  (Arctic library)  │
│   Supabase)    │ │   AI Studio) │ │                    │
└────────────────┘ └──────────────┘ └────────────────────┘
```

---

## 🛠️ Technologies Used

### Frontend
| Technology | Role |
|---|---|
| **Next.js 16** (App Router) | Full-stack React framework, file-based routing, SSR |
| **React 19** | UI component model |
| **TypeScript 5.7** | Type safety across the entire codebase |
| **Tailwind CSS v4** | Utility-first styling |
| **Radix UI** | Accessible headless UI primitives (Dialog, Tabs, Select, etc.) |
| **Recharts** | Data visualization for BSS scores and category breakdowns |
| **Lucide React** | Icon system |
| **React Hook Form + Zod** | Form management and schema validation |
| **Sonner** | Toast notifications |
| **jsPDF + html2canvas** | Client-side PDF export |

### Backend / API
| Technology | Role |
|---|---|
| **Next.js API Routes** | Serverless API endpoints for auth, audits, datasets |
| **Prisma ORM v6** | Type-safe database access layer |
| **PostgreSQL** | Relational database (hosted on Neon or Supabase) |
| **Lucia Auth v3** | Session-based authentication |
| **Arctic** | OAuth 2.0 client for Google Sign-In |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT utilities |

### AI / Behavioral Engine
| Technology | Role |
|---|---|
| **Google Gemini API** | Primary LLM provider for behavioral probing |
| **Custom Scoring Engine** | BSS calculation: sentiment, tone, length, hedge, refusal, gender dimensions |
| **PapaParse** | CSV parsing for optional dataset uploads |

### DevOps & Tooling
| Technology | Role |
|---|---|
| **pnpm** | Fast, disk-efficient package manager |
| **ESLint** | Code linting |
| **Vercel Analytics** | Usage and performance monitoring |
| **Vercel** | Recommended deployment platform |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (or a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) instance)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kaustubh010/Fairlens.git
cd Fairlens

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your database URL, Google OAuth credentials, etc.

# 4. Run database migrations
pnpm prisma migrate deploy

# 5. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ to make AI systems more transparent and accountable.</p>
