# Rosetta Learning Engine — Implementation Plan

> **For the developer:** This file is your north star. Read it top to bottom before writing a single line of code. Every decision here traces back to the Master Architecture Document (PRD). When in doubt, refer back to the PRD. When the PRD and this file conflict, the PRD wins.

---

## What We Are Building

A concept translation engine that rebuilds any idea using the mental models a specific person already owns. The product is not an LMS, not a tutoring platform, not a flashcard app. It is a **personalized explanation engine with a cognitive fingerprinting layer**.

The magic moment we are optimizing for: *a user has struggled to understand something for years. In under 90 seconds, it clicks — not because it was simplified, but because it was rebuilt in the shape of how their mind works.*

Everything in Phase 1 serves that moment.

---

## Ground Rules Before You Start

- **Never build ahead of the phase.** Phase 1 has no database persistence for users. No auth. No spaced repetition. Just the ingestion → explanation → transfer test loop. Resist the urge to scaffold Phase 2 early.
- **Structured outputs only.** Every LLM call returns JSON, not raw text. No downstream layer ever parses a prose string.
- **Measure everything from day one.** The metrics system is not an afterthought. It is built in Phase 1 alongside the core feature.
- **Claude API is the only LLM.** Use `claude-sonnet-4-5` for explanation generation. Use `claude-haiku-4-5-20251001` for evaluation/scoring calls (cost efficiency).

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Keep it minimal in Phase 1 — no UI library needed yet |
| Backend | Node.js + Express | REST API, no GraphQL yet |
| LLM | Anthropic Claude API | Sonnet for generation, Haiku for evaluation |
| Prompt orchestration | LangChain (Node) | Session context management, prompt chaining |
| Database (Phase 2+) | PostgreSQL + JSONB | Not needed in Phase 1 |
| Graph DB (Phase 2+) | Neo4j | Not needed in Phase 1 |
| Cache / Scheduler (Phase 2+) | Redis | Not needed in Phase 1 |
| Analytics | PostHog | Install from day one, even in Phase 1 |
| Frontend hosting | Vercel | |
| Backend hosting | Railway | |

---

## Repository Structure

```
rosetta/
├── apps/
│   ├── web/                        # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ConceptInput.jsx
│   │   │   │   ├── FingerprintChat.jsx
│   │   │   │   ├── ExplanationDisplay.jsx
│   │   │   │   └── TransferTest.jsx
│   │   │   ├── pages/
│   │   │   │   ├── Home.jsx
│   │   │   │   └── Session.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useSession.js
│   │   │   └── main.jsx
│   │   └── vite.config.js
│   │
│   └── api/                        # Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   └── session.js
│       │   ├── services/
│       │   │   ├── rosettaEngine.js      # Core engine
│       │   │   ├── subsumerFinder.js     # Stage 1 prompt
│       │   │   ├── analogyConstructor.js # Stage 2 prompt
│       │   │   ├── explanationArchitect.js # Stage 3 prompt
│       │   │   └── transferTestGen.js    # Stage 4 prompt
│       │   ├── prompts/
│       │   │   ├── subsumerFinder.prompt.js
│       │   │   ├── analogyConstructor.prompt.js
│       │   │   ├── explanationArchitect.prompt.js
│       │   │   └── transferTestGen.prompt.js
│       │   ├── middleware/
│       │   │   └── validateSession.js
│       │   └── index.js
│       └── package.json
│
├── packages/
│   └── shared/                     # Shared types and schemas
│       ├── schemas/
│       │   ├── SessionContext.js
│       │   ├── ExplanationOutput.js
│       │   └── TransferTestResult.js
│       └── index.js
│
├── .env.example
└── README.md
```

---

## Phase 1 — Prove the Magic Moment

**Duration:** Weeks 1–8  
**Goal:** Demonstrate that personalized concept translation produces measurably better understanding than generic explanation.  
**What we are NOT building yet:** persistent user accounts, spaced repetition, cross-domain logic, any ML.

---

### Week 1–2 — Project Setup & Session API

#### Tasks

**1. Monorepo setup**
```bash
# Use npm workspaces
npm init -w apps/web -w apps/api -w packages/shared
```

**2. Environment variables**
```env
# .env.example
ANTHROPIC_API_KEY=
POSTHOG_API_KEY=
PORT=3001
NODE_ENV=development
```

**3. Core data schemas** — build these first, everything depends on them

```javascript
// packages/shared/schemas/SessionContext.js
const SessionContextSchema = {
  session_id: "string (uuid)",
  created_at: "timestamp",
  concept: {
    raw: "string",              // what the user typed
    domain: "string",           // parsed: 'mathematics', 'programming', etc.
    abstraction_level: "1-5",   // 1=concrete, 5=highly abstract
    prerequisites: ["string"]   // inferred prerequisite concepts
  },
  fingerprint: {
    dominant_domains: ["string"],     // top 2-3 knowledge areas
    strong_subsumers: ["string"],     // specific mental models they own
    reasoning_style: "enum"           // narrative | logical | visual | mechanical
  },
  state: {
    urgency: "1-5",
    frustration_level: "1-5"
  }
}
```

```javascript
// packages/shared/schemas/ExplanationOutput.js
const ExplanationOutputSchema = {
  session_id: "string",
  subsumer_used: "string",           // which mental model was the anchor
  analogy_type: "string",            // what structural mapping was used
  chunks: [                          // max 4 chunks (working memory constraint)
    {
      chunk_number: "integer",
      content: "string",
      builds_on: "string | null"     // which previous chunk this extends
    }
  ],
  native_domain_restatement: "string", // final restatement in the concept's real domain
  transfer_test: {
    scenario: "string",              // novel application context
    expected_insight: "string"       // what a correct answer would demonstrate (internal only)
  }
}
```

```javascript
// packages/shared/schemas/TransferTestResult.js
const TransferTestResultSchema = {
  session_id: "string",
  user_response: "string",
  score: "enum",                    // integrated | surface | not_yet
  score_reasoning: "string",        // why the score was given (internal)
  clicked: "boolean",               // user's self-report
  attempt_number: "integer"         // 1, 2, or 3
}
```

**4. Session API endpoints**

```javascript
// apps/api/src/routes/session.js

// POST /api/session/start
// Body: { concept: string }
// Returns: { session_id, fingerprint_questions: string[] }
// Purpose: parse the concept, return 2-3 fingerprint questions

// POST /api/session/fingerprint  
// Body: { session_id, answers: { q1: string, q2: string, q3?: string } }
// Returns: { session_id, state_questions: string[] }
// Purpose: extract fingerprint from answers, return state questions

// POST /api/session/explain
// Body: { session_id, state: { urgency: 1-5, frustration_level: 1-5 } }
// Returns: ExplanationOutput
// Purpose: run the full Rosetta Engine, return structured explanation

// POST /api/session/evaluate
// Body: { session_id, user_response: string, clicked: boolean }
// Returns: TransferTestResult
// Purpose: score the transfer test, determine next step

// POST /api/session/retry
// Body: { session_id, attempt_number: integer }
// Returns: ExplanationOutput (with different subsumer)
// Purpose: if not_yet score, try a different translation path
```

---

### Week 3–4 — The Rosetta Engine (Core)

This is the most important part of the entire system. Take your time here.

The engine runs four sequential prompt stages. Each stage takes JSON in and returns JSON out. No raw text crosses stage boundaries.

#### Stage 1 — Subsumer Finder

```javascript
// apps/api/src/prompts/subsumerFinder.prompt.js

export const subsumerFinderPrompt = (concept, fingerprint) => `
You are analyzing what mental models a person already owns that could serve as 
a cognitive anchor for learning a new concept.

TARGET CONCEPT: ${concept.raw}
DOMAIN: ${concept.domain}
ABSTRACTION LEVEL: ${concept.abstraction_level} / 5

THIS PERSON'S KNOWN MENTAL MODELS:
- Dominant knowledge domains: ${fingerprint.dominant_domains.join(', ')}
- Strong subsumers (specific things they understand deeply): ${fingerprint.strong_subsumers.join(', ')}
- Reasoning style: ${fingerprint.reasoning_style}

A subsumer is an existing mental model that shares STRUCTURAL similarity 
(not surface similarity) with the target concept. 

For example:
- Compound interest and harmonic series share the structure of multiplicative growth over time
- Chord progressions and function composition share the structure of sequenced building blocks
- Traffic flow and TCP/IP packets share the structure of batched units navigating bottlenecks

Your task: identify the top 3 subsumer candidates from this person's known domains.

Return ONLY valid JSON, no other text:
{
  "candidates": [
    {
      "subsumer": "specific concept name from their domain",
      "domain": "which of their domains this comes from",
      "structural_mapping": "one sentence: what structural property is shared",
      "match_score": 0.0-1.0,
      "risk": "one sentence: where this analogy might break down"
    }
  ]
}
`;
```

#### Stage 2 — Analogy Constructor

```javascript
// apps/api/src/prompts/analogyConstructor.prompt.js

export const analogyConstructorPrompt = (concept, winningSubsumer) => `
You are building a structural analogy bridge between two concepts.

TARGET CONCEPT: ${concept.raw}
ANCHOR (what this person already understands): ${winningSubsumer.subsumer}
STRUCTURAL MAPPING: ${winningSubsumer.structural_mapping}

Your task: build the precise component-by-component mapping between these two concepts.
Map every key element of the target concept to its equivalent in the anchor concept.

Important rules:
- Map STRUCTURE, not surface appearance
- Only map elements that genuinely correspond — do not force mappings
- Note where the analogy breaks down honestly

Return ONLY valid JSON:
{
  "mapping": [
    {
      "target_element": "element in the concept being learned",
      "anchor_element": "equivalent element in the subsumer",
      "relationship": "how they correspond structurally"
    }
  ],
  "analogy_breaks_at": "where this analogy stops being accurate",
  "bridge_sentence": "one sentence that captures the core structural insight"
}
`;
```

#### Stage 3 — Explanation Architect

```javascript
// apps/api/src/prompts/explanationArchitect.prompt.js

export const explanationArchitectPrompt = (concept, mapping, fingerprint, state) => `
You are building a personalized explanation of a concept using a structural analogy.

TARGET CONCEPT: ${concept.raw}
ANCHOR CONCEPT: ${mapping.anchor}
BRIDGE SENTENCE: ${mapping.bridge_sentence}
STRUCTURAL MAPPING: ${JSON.stringify(mapping.mapping)}

PERSON'S REASONING STYLE: ${fingerprint.reasoning_style}
PREFERRED CHUNK SIZE: ${fingerprint.preferred_chunk_size || 3} chunks
FRUSTRATION LEVEL: ${state.frustration_level} / 5  (higher = start more gently)
URGENCY: ${state.urgency} / 5  (higher = be more direct, less build-up)

Rules for the explanation:
1. Maximum ${fingerprint.preferred_chunk_size || 3} chunks (working memory constraint — never exceed 4)
2. Each chunk builds on the previous — never introduce two new ideas at once
3. Use the anchor concept as the entry point, not the target concept
4. The FINAL chunk must restate the concept in its native domain
   so the person can see they learned the real thing, not just a metaphor
5. Frustration > 3: start even further back, use simpler language in chunk 1
6. Urgency > 3 and frustration < 3: compress chunks, move faster to application

Return ONLY valid JSON:
{
  "chunks": [
    {
      "chunk_number": 1,
      "title": "short label for this step",
      "content": "the actual explanation text for this chunk",
      "builds_on": null
    },
    {
      "chunk_number": 2,
      "title": "short label",
      "content": "explanation text",
      "builds_on": "chunk 1"
    }
  ],
  "native_domain_restatement": "final restatement in the concept's actual domain — confirm this is the real concept",
  "subsumer_used": "${mapping.anchor}",
  "analogy_type": "one phrase describing the structural mapping used"
}
`;
```

#### Stage 4 — Transfer Test Generator

```javascript
// apps/api/src/prompts/transferTestGen.prompt.js

export const transferTestGenPrompt = (concept, explanation) => `
You are generating a transfer test for a concept that was just explained.

TARGET CONCEPT: ${concept.raw}
SUBSUMER USED IN EXPLANATION: ${explanation.subsumer_used}
ANALOGY TYPE: ${explanation.analogy_type}

A transfer test checks whether the person genuinely understood the concept,
not just the analogy. It must:
1. Present a scenario in a THIRD domain (not the target concept's domain, 
   not the subsumer's domain)
2. Require applying the concept's core principle to solve it
3. Have a clear correct reasoning path (but not a single "right answer" word)

Return ONLY valid JSON:
{
  "scenario": "the scenario presented to the user — 2-4 sentences",
  "question": "the specific question asked",
  "expected_insight": "what a correct response would demonstrate (internal use only — never shown to user)",
  "common_misconception": "what a surface-level (non-integrated) response looks like"
}
`;
```

#### Stage 4b — Transfer Test Evaluator

```javascript
// apps/api/src/prompts/transferTestEval.prompt.js
// Uses claude-haiku-4-5-20251001 (not Sonnet — this is a scoring call, not generation)

export const transferTestEvalPrompt = (test, userResponse) => `
Score this transfer test response.

SCENARIO SHOWN TO USER: ${test.scenario}
QUESTION ASKED: ${test.question}
EXPECTED INSIGHT: ${test.expected_insight}
COMMON MISCONCEPTION: ${test.common_misconception}

USER RESPONSE: ${userResponse}

Scoring rubric:
- "integrated": user demonstrates the core principle, could apply it again in another context
- "surface": user restates the analogy but doesn't show they can apply the principle independently  
- "not_yet": user misses the core principle, response suggests the concept did not integrate

Return ONLY valid JSON:
{
  "score": "integrated | surface | not_yet",
  "reasoning": "one sentence explaining the score",
  "what_they_got": "what the user did understand",
  "what_is_missing": "what is not yet there (null if integrated)"
}
`;
```

#### Rosetta Engine Orchestrator

```javascript
// apps/api/src/services/rosettaEngine.js

import Anthropic from '@anthropic-ai/sdk';
import { subsumerFinderPrompt } from '../prompts/subsumerFinder.prompt.js';
import { analogyConstructorPrompt } from '../prompts/analogyConstructor.prompt.js';
import { explanationArchitectPrompt } from '../prompts/explanationArchitect.prompt.js';
import { transferTestGenPrompt } from '../prompts/transferTestGen.prompt.js';

const client = new Anthropic();

const callSonnet = async (prompt) => {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  return JSON.parse(response.content[0].text);
};

const callHaiku = async (prompt) => {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });
  return JSON.parse(response.content[0].text);
};

export const runRosettaEngine = async (sessionContext) => {
  const { concept, fingerprint, state } = sessionContext;

  // Stage 1: Find best subsumer candidates
  const subsumerResult = await callSonnet(
    subsumerFinderPrompt(concept, fingerprint)
  );
  const winningSubsumer = subsumerResult.candidates[0]; // highest match_score

  // Stage 2: Build structural analogy mapping
  const analogyResult = await callSonnet(
    analogyConstructorPrompt(concept, winningSubsumer)
  );

  // Stage 3: Architect the explanation
  const explanationResult = await callSonnet(
    explanationArchitectPrompt(concept, analogyResult, fingerprint, state)
  );

  // Stage 4: Generate transfer test
  const transferTest = await callSonnet(
    transferTestGenPrompt(concept, explanationResult)
  );

  return {
    subsumer_candidates: subsumerResult.candidates,
    subsumer_used: winningSubsumer,
    analogy_mapping: analogyResult,
    explanation: explanationResult,
    transfer_test: transferTest
  };
};

export const evaluateTransferTest = async (test, userResponse) => {
  return await callHaiku(transferTestEvalPrompt(test, userResponse));
};
```

---

### Week 5–6 — Frontend

Keep this minimal. The magic is in the engine, not the UI. Clean, focused, no distractions.

#### Session flow (single page, sequential states)

```
State 1: CONCEPT_INPUT
  → Simple text input: "What's a concept you've been trying to understand?"
  → Submit → API: POST /session/start

State 2: FINGERPRINT_CHAT  
  → Display questions one at a time, conversational feel
  → Not a form — feels like a dialogue
  → Submit answers → API: POST /session/fingerprint

State 3: STATE_CAPTURE
  → Two sliders: "How frustrated are you with this?" / "How urgent is this for you?"
  → Submit → API: POST /session/explain (triggers engine)

State 4: LOADING
  → 3-5 second wait (signals "something is being built for you")
  → Do NOT use a spinner — use a message: "Building your explanation..."

State 5: EXPLANATION
  → Display chunks sequentially, not all at once
  → Reveal chunk 2 after 4 seconds, chunk 3 after another 4 seconds
  → Creates reading rhythm, prevents overwhelming
  → After all chunks: display native domain restatement in a distinct style

State 6: TRANSFER_TEST
  → Display scenario + question
  → Free text response (no word limit)
  → Submit → API: POST /session/evaluate

State 7: RESULT
  → If "integrated": celebration, offer to start a new concept
  → If "surface": brief encouragement, show what they got right, offer retry
  → If "not_yet": "Let me try a different angle" → API: POST /session/retry
  → Always: "Did that click?" binary yes/no (logged to PostHog)
```

#### Key UX rules
- No navigation. No sidebar. One task at a time.
- Progress indicator: dots, not percentages
- The explanation chunks should feel like they're being written in real time (typewriter effect optional but effective)
- Mobile-first layout — many users will be on phone

---

### Week 7–8 — Analytics & Success Metrics

PostHog events to instrument from day one:

```javascript
// Every event goes to PostHog with session_id as the identifier

posthog.capture('session_started', {
  session_id,
  concept_domain,
  abstraction_level
});

posthog.capture('fingerprint_captured', {
  session_id,
  reasoning_style,
  dominant_domain_count: dominant_domains.length
});

posthog.capture('explanation_delivered', {
  session_id,
  subsumer_used,
  analogy_type,
  chunk_count,
  time_to_deliver_ms
});

posthog.capture('transfer_test_submitted', {
  session_id,
  attempt_number,
  score,                    // integrated | surface | not_yet
  time_since_explanation_ms
});

posthog.capture('clicked_self_report', {
  session_id,
  clicked,                  // boolean
  attempt_number
});

posthog.capture('session_completed', {
  session_id,
  final_score,
  total_attempts,
  total_time_ms
});
```

**Phase 1 success gate** (must hit before building Phase 2):
- 70%+ of sessions: user reports "clicked" on concepts previously stuck on
- 65%+ transfer test pass rate (integrated or surface) within 2 attempts
- Average time-to-understanding under 90 seconds from explanation delivery
- At least 100 completed sessions with data

---

## Phase 2 — Build the Memory

**Start only after Phase 1 success gate is hit.**  
**Duration:** Weeks 9–20

### What gets added

**PostgreSQL schema** — users, fingerprints, domain journeys, learning timeline events  
**User auth** — email/magic link only (no password), session persistence  
**Personal graph persistence** — fingerprint grows across sessions  
**Domain journeys** — guitar and Python tracked separately, fingerprint shared  
**Spaced repetition scheduler** — Redis job queue, retrieval in new contexts  
**Cross-domain bridge detection** — structural similarity search across domain journeys  
**Return session flow** — system greets with context, proposes continuations  
**Liquid Glass UI Revision (Backlog)** — implement the Ethereal Studio UI design (layered translucent panels, large typography, colorful blur gradients) across the concept input, fingerprint chat, and explanation views.

### Database migrations order
1. Users table
2. Fingerprints table (1:1 with users)
3. Domain journeys table (many:1 with users)
4. Learning timeline events table (many:1 with domain journeys)
5. Cross-domain signals table (many:many between journeys)

### Key Phase 2 API additions
```
GET  /api/user/me                     # return user + fingerprint + active domains
GET  /api/user/journey/:domain        # return full domain journey with timeline
POST /api/user/journey/:domain/start  # create or resume a domain journey
GET  /api/user/retrievals/due         # concepts due for spaced repetition today
POST /api/session/start               # now accepts user context, not just concept
```

---

## Phase 3 — Derive the Law

**Start only after Phase 2 has 1000+ registered users with 5+ sessions each.**  
**Duration:** Months 6–18

### What gets added

**Neo4j concept graph** — 1000+ concepts with prerequisite, analogy, application, interference edges  
**Cognitive profile clustering** — unsupervised clustering of fingerprints  
**Subsumer prediction model** — XGBoost model predicting subsumer match quality  
**Learning velocity prediction** — predicted time-to-understanding per profile + concept  
**The Newton moment** — cross-user law emerges from data  

---

## Error Handling Conventions

```javascript
// All API errors follow this shape
{
  error: {
    code: "SESSION_NOT_FOUND | ENGINE_FAILED | INVALID_INPUT | ...",
    message: "human-readable message",
    session_id: "string | null"
  }
}

// Engine failures: retry once automatically before returning error
// If stage 1 (subsumer finder) fails: return a generic subsumer based on concept domain
// If stage 3 (explanation architect) fails: return error, do not show partial explanation
// Never show the user a raw LLM error
```

---

## Things That Will Tempt You — Don't Do Them

| Temptation | Why to resist |
|---|---|
| Adding user accounts in Phase 1 | Slows you down by 2 weeks. Not needed to prove the magic moment. |
| Building a "dashboard" or "progress" UI | Phase 1 is a single session flow. No history yet. |
| Supporting multiple concepts per session | One concept per session. Depth over breadth. |
| Fine-tuning the LLM | Prompt engineering gets you 90% there in Phase 1. Fine-tuning is Phase 3+. |
| Building the Neo4j concept graph early | You don't have the data to populate it yet. Build it when you have 1000+ sessions. |
| Adding voice / multimodal | Distraction. Text first. Prove the core thesis. |
| Skipping the transfer test | It is not optional. It is the primary success signal. Everything else is noise without it. |

---

## Definition of Done — Phase 1

A session is considered successful when:
1. User provides a concept they're stuck on
2. System captures fingerprint in ≤ 3 questions
3. Rosetta Engine returns a valid ExplanationOutput with 3-4 chunks
4. Transfer test is generated and presented
5. User response is evaluated and scored
6. Result + self-report ("clicked?") is captured in PostHog
7. If score is "not_yet", a retry with different subsumer is available

Phase 1 is complete when all of the above work reliably across 100 sessions with no engine failures, and the Phase 1 success metrics are hit.

---

## First PR Checklist

Before your first pull request is merged:

- [ ] SessionContext schema defined in `packages/shared`
- [ ] ExplanationOutput schema defined in `packages/shared`
- [ ] TransferTestResult schema defined in `packages/shared`
- [ ] All 4 prompt files created with correct JSON output instructions
- [ ] `runRosettaEngine()` orchestrates all 4 stages correctly
- [ ] `evaluateTransferTest()` uses Haiku, not Sonnet
- [ ] All API routes return errors in the standard error shape
- [ ] PostHog initialized and `session_started` event firing
- [ ] `.env.example` committed (never `.env`)
- [ ] README has local setup instructions (should take < 5 minutes)

---

## Questions to Ask Before Adding Anything New

1. Does this exist in the PRD?
2. Is this Phase 1, 2, or 3 work?
3. Does this improve the magic moment — or distract from it?
4. Will this generate data we need for the next phase?

If you can't answer all four, don't build it yet.

---

*Rosetta Learning Engine — Implementation Plan v1.0*  
*Derived from Master Architecture Document. For questions about design decisions, refer to the PRD.*
