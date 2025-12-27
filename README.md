# 🛡️ TrustLayer AI

> **Decentralized AI Inference with Proof of Inference (PoI) and Proof of Useful Work (PoUW)**

[![Built on Cortensor](https://img.shields.io/badge/Built%20on-Cortensor-00D4FF?style=for-the-badge)](https://cortensor.network)
[![Hackathon #3](https://img.shields.io/badge/Hackathon-%233-purple?style=for-the-badge)](https://docs.cortensor.network/community-and-ecosystem/hackathon/hackathon-3)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🎯 The Problem: Why Centralized AI Fails

Centralized AI inference is fundamentally broken:

| Problem | Impact |
|---------|--------|
| **Single Point of Failure** | One API goes down, your entire application breaks |
| **No Verification** | You trust blindly - no way to verify outputs aren't manipulated |
| **Censorship Risk** | One entity controls what AI can/cannot say |
| **Opaque Pricing** | Hidden costs, unpredictable rate limits |
| **Privacy Concerns** | Your prompts stored on corporate servers indefinitely |

**TrustLayer AI solves this** by leveraging Cortensor's decentralized inference network to provide:
- ✅ Redundant inference across 3+ independent miners
- ✅ Cryptographic consensus validation
- ✅ Verifiable trust receipts for every query
- ✅ No single point of failure
- ✅ Transparent, auditable AI

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TrustLayer AI                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────────────┐    ┌──────────────────────┐   │
│   │   Frontend  │───▶│   Edge Function     │───▶│  Cortensor Router    │   │
│   │  (React)    │    │  (Deno/Supabase)    │    │   (REST API v1)      │   │
│   └─────────────┘    └─────────────────────┘    └──────────────────────┘   │
│         │                     │                           │                 │
│         │                     │                           ▼                 │
│         │                     │               ┌───────────────────────┐    │
│         │                     │               │      Miner Pool       │    │
│         │                     │               ├───────────────────────┤    │
│         │                     │               │ ┌─────┐ ┌─────┐ ┌─────┐│   │
│         │                     │               │ │M1   │ │M2   │ │M3   ││   │
│         │                     │               │ │LLaMA│ │LLaMA│ │LLaMA││   │
│         │                     │               │ └─────┘ └─────┘ └─────┘│   │
│         │                     │               └───────────────────────┘    │
│         │                     ▼                           │                 │
│         │         ┌─────────────────────┐                 │                 │
│         │         │   PoI Engine        │◀────────────────┘                 │
│         │         │   (Proof of         │                                   │
│         │         │    Inference)       │                                   │
│         │         └─────────────────────┘                                   │
│         │                     │                                             │
│         │                     ▼                                             │
│         │         ┌─────────────────────┐                                   │
│         │         │   PoUW Engine       │                                   │
│         │         │   (Proof of Useful  │                                   │
│         │         │    Work)            │                                   │
│         │         └─────────────────────┘                                   │
│         │                     │                                             │
│         │                     ▼                                             │
│         │         ┌─────────────────────┐                                   │
│         ◀─────────│   Trust Receipt     │                                   │
│                   │   Generator         │                                   │
│                   └─────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 How It Works

### 1️⃣ Proof of Inference (PoI)

For every inference request, TrustLayer AI:

1. **Sends the prompt to 3+ independent miners** on the Cortensor network
2. **Collects responses** with timing metadata (latency, timestamps)
3. **Computes similarity scores** using multiple algorithms:
   - Levenshtein distance (character-level)
   - Jaccard similarity (token-level)
   - N-gram analysis (phrase-level)
4. **Calculates agreement percentage** across all miner responses
5. **Identifies outliers** using statistical deviation analysis

```typescript
// Example PoI output
{
  miner_results: [
    { miner_id: "miner_A", response: "Paris is the capital of France", latency_ms: 156 },
    { miner_id: "miner_B", response: "The capital of France is Paris", latency_ms: 203 },
    { miner_id: "miner_C", response: "Paris is France's capital city", latency_ms: 178 }
  ],
  agreement_score: 94,
  outliers: []
}
```

### 2️⃣ Proof of Useful Work (PoUW)

After PoI, validators score each miner's output:

| Metric | Weight | Description |
|--------|--------|-------------|
| **Response Quality** | 25% | Length, structure, completeness |
| **Latency Score** | 20% | Faster responses score higher |
| **Consistency Score** | 55% | Agreement with other miners |
| **Reputation Modifier** | ±20% | Historical performance |

**Decision Rules:**
- `agreement_score < 60%` → **REJECT**
- `validator_score < 70` → **REJECT**
- Both thresholds met → **APPROVE**

### 3️⃣ Trust Receipts

Every inference generates a cryptographic receipt:

```json
{
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "task": "factual-query",
  "input": "What is the capital of France?",
  "miners": ["miner_A_x7k2", "miner_B_p9m1", "miner_C_r4n8"],
  "outputs": ["Paris is the capital...", "The capital of France...", "Paris is France's..."],
  "agreement_score": 94,
  "validator_score": 87,
  "final_output": "Paris is the capital of France.",
  "decision": "approved",
  "timestamp": "2025-12-27T18:30:00.000Z"
}
```

---

## 🚀 Quick Start (Under 60 Seconds)

### Option A: Use the Live Demo

1. Visit the deployed app
2. Click **"Try Demo"** button
3. Watch the agent pipeline animate through states
4. View miner responses, trust scores, and the final receipt
5. Export the receipt as JSON

### Option B: Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/trustlayer-ai.git
cd trustlayer-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Option C: Connect to Cortensor Router

To use real decentralized inference (not demo mode):

1. Set up a Cortensor Router Node ([docs](https://docs.cortensor.network/getting-started/installation-and-setup/router-node-setup))
2. Add your router URL as a secret:
   - In Lovable: Settings → Secrets → Add `CORTENSOR_ROUTER_URL`
   - Value: `https://your-router.example.com:5010`
3. Refresh the app - it will automatically connect to your router

---

## 🖥️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **shadcn/ui** | Component library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase Edge Functions** | Serverless backend |
| **Deno** | Runtime |
| **Cortensor Router v1** | Decentralized inference API |

### Cortensor Integration
| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/status` | Health check |
| `GET /api/v1/miners` | List available miners |
| `GET /api/v1/sessions` | Active sessions |
| `POST /api/v1/completions/{sessionId}` | Submit inference |

---

## 📁 Project Structure

```
trustlayer-ai/
├── src/
│   ├── components/
│   │   ├── AgentTimeline.tsx      # Animated state machine visualization
│   │   ├── DemoButton.tsx         # One-click demo trigger
│   │   ├── MinerComparisonTable.tsx  # Side-by-side miner responses
│   │   ├── TaskInput.tsx          # Prompt input form
│   │   ├── TrustGauge.tsx         # Visual trust score gauge
│   │   └── TrustReceipt.tsx       # Exportable receipt card
│   ├── hooks/
│   │   └── useAgentPipeline.ts    # State machine hook
│   ├── lib/
│   │   ├── cortensor-client.ts    # Cortensor API client
│   │   └── validation.ts          # PoI/PoUW algorithms
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── pages/
│       └── Index.tsx              # Main application page
├── supabase/
│   └── functions/
│       └── cortensor-inference/   # Edge function for inference
│           └── index.ts
├── README.md                      # This file
└── package.json
```

---

## 🎨 UI Features

### Agent State Timeline
Animated visualization of the 6-state agent pipeline:
```
IDLE → CONNECTING → INFERENCING → VALIDATING → APPROVED/REJECTED → EXECUTED
```

### Miner Comparison Table
- Side-by-side response comparison
- Latency metrics per miner
- Similarity percentage indicators
- Outlier highlighting

### Trust Gauge
- Semi-circular gauge visualization
- Threshold markers for pass/fail
- Color-coded decision (green/red)

### Trust Receipt
- Expandable/collapsible card
- Full JSON preview
- One-click copy to clipboard
- Export as `.json` file

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CORTENSOR_ROUTER_URL` | No | URL to Cortensor Router (uses demo mode if not set) |
| `CORTENSOR_API_KEY` | No | Router API key (defaults to `default-dev-token`) |

### Validation Thresholds

Edit `src/types/index.ts` to customize:

```typescript
export const VALIDATION_THRESHOLDS = {
  MIN_AGREEMENT: 60,    // Minimum % agreement between miners
  MIN_TRUST_SCORE: 70,  // Minimum validator score (0-100)
} as const;
```

---

## 📊 Scoring Algorithms

### Levenshtein Similarity
Character-level edit distance, normalized to 0-100:
```
similarity = (1 - (distance / max_length)) * 100
```

### Jaccard Similarity
Token overlap between responses:
```
similarity = |A ∩ B| / |A ∪ B| * 100
```

### Combined Score
Weighted average:
```
combined = (jaccard * 0.5) + (ngram * 0.3) + (levenshtein * 0.2)
```

---

## 🏆 Hackathon Alignment

This project addresses multiple Hackathon #3 focus areas:

| Focus Area | Implementation |
|------------|----------------|
| **Agentic Applications** | Autonomous agent pipeline with state machine |
| **PoI/PoUW Utilization** | Full implementation of redundant inference + validator scoring |
| **Validation & Attestations** | Trust receipts with evidence bundles (JSON export) |
| **Developer Tooling** | Reusable components, typed APIs, documented code |
| **Public Goods** | Open-source, MIT licensed, community benefit |

---

## 🛣️ Roadmap

### Phase 1: PoC (Current)
- [x] Agent state machine
- [x] PoI redundant inference
- [x] PoUW validator scoring
- [x] Trust receipt generation
- [x] Demo mode fallback
- [x] Animated UI

### Phase 2: Production
- [ ] Real Cortensor Router integration
- [ ] On-chain receipt attestation
- [ ] Session management
- [ ] Miner reputation tracking

### Phase 3: Advanced
- [ ] ERC-8004 agent identity artifacts
- [ ] x402 pay-per-call integration
- [ ] Multi-model support
- [ ] IPFS receipt storage

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Cortensor Documentation**: [docs.cortensor.network](https://docs.cortensor.network)
- **Hackathon #3 Details**: [Hackathon Page](https://docs.cortensor.network/community-and-ecosystem/hackathon/hackathon-3)
- **Router API Reference**: [Web2 API Docs](https://docs.cortensor.network/getting-started/web2-api-reference)
- **Discord**: [discord.gg/cortensor](https://discord.gg/cortensor)

---

<p align="center">
  <strong>Built with 🛡️ for Cortensor Hackathon #3</strong>
  <br>
  <em>Trustless AI for Everyone</em>
</p>
