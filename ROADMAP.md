# Synapse Roadmap (Execution-First)

## Project Goal
Convert Synapse into a **portfolio-grade, production-ready legal analysis platform** that proves real-world engineering capability (security, architecture, reliability, and delivery discipline).

## Success Criteria (Definition of Done)
- ✅ Secure architecture (no client-exposed secrets, robust auth/session flow)
- ✅ Stable CI build + lint + type checks
- ✅ End-to-end demo flow works reliably (auth → upload → OCR → analysis → chat)
- ✅ Production docs (README, ARCHITECTURE, RUNBOOK)
- ✅ Public evidence package (demo video + decisions + roadmap progress)

---

## Phase 0 — Technical Hardening (Week 1)
**Objective:** Remove critical risks and make the app consistently build/run.

### Scope
1. **Secrets & Security**
   - Remove usage of `NEXT_PUBLIC_CEREBRAS_API_KEY`
   - Enforce server-only `CEREBRAS_API_KEY`
   - Add env validation and safe startup errors

2. **Build Reliability**
   - Prevent Supabase client initialization from breaking prerender/build
   - Ensure `/auth` route does not fail when envs are missing in CI/local

3. **Auth Correctness**
   - Implement actual `signOut()` (not only redirect)
   - Verify callback/session handling paths

4. **Schema/Types Consistency**
   - Sync `types/supabase.ts` with migrations (`extracted_text`, etc.)
   - Remove drift between DB schema and app types

5. **LLM Contract Robustness**
   - Fix analysis response format contract (array/object mismatch)
   - Add defensive parse + validation + fallback error messaging

### Deliverables
- Hardened code merged in `main`
- Build passes: `pnpm lint && pnpm build`
- Security notes documented in `ARCHITECTURE.md`

### Exit Gate
- No exposed API keys
- No build-time crashes in default path

---

## Phase 1 — Product Reliability (Week 2)
**Objective:** Make user workflows dependable and observable.

### Scope
1. **Document Pipeline Reliability**
   - Retry strategy for OCR/analysis failures
   - Status transitions: `pending -> processing -> analyzed/failed`
   - Better user-facing failure reasons

2. **Background Processing**
   - Move heavy analysis/OCR out of UI-thread flow where possible
   - Introduce job-oriented architecture (queue/table-based if needed)

3. **Validation & Limits**
   - Strong file validation (mime, size, malformed PDFs)
   - Rate limiting for `/api/chat` and analysis endpoints

4. **Chat Safety/Context**
   - Replace brittle context transport with structured payloads
   - Prevent malformed system-context parsing

### Deliverables
- Reliable pipeline with explicit states
- Improved UX around failures/retries
- API guardrails documented

### Exit Gate
- Reproducible upload/analyze success on test set
- Controlled failure behavior (no silent breaks)

---

## Phase 2 — Engineering Quality (Week 3)
**Objective:** Demonstrate senior-level engineering discipline.

### Scope
1. **Testing Baseline**
   - Unit tests for analysis parsing/validation
   - Integration tests for core API routes
   - Smoke e2e for auth + upload + analysis

2. **CI/CD**
   - GitHub Actions for lint/typecheck/build/test
   - PR checks + status badges

3. **Observability**
   - Structured logging (request id, user id hash, operation)
   - Error tracking integration (Sentry or equivalent)

4. **Performance Baseline**
   - Measure large document processing time
   - Define practical limits and timeout behavior

### Deliverables
- CI pipeline with required checks
- Test suite + coverage baseline
- Logs/error strategy documented

### Exit Gate
- Green CI on PRs
- Core paths covered by automated checks

---

## Phase 3 — Portfolio Packaging (Week 4)
**Objective:** Turn work into undeniable proof of competence.

### Scope
1. **Documentation Upgrade**
   - `README.md` (problem, architecture, setup, trade-offs)
   - `ARCHITECTURE.md` (components, data flow, security model)
   - `RUNBOOK.md` (ops/debug/common failures)

2. **Demo Evidence**
   - 2–4 min walkthrough video
   - Before/after hardening notes
   - Key technical decisions with rationale

3. **Public Credibility Assets**
   - Curated issues/PRs showing decision quality
   - One technical writeup: “How we hardened Synapse for production”

### Deliverables
- Complete portfolio package
- Recruiter/interviewer-friendly proof artifacts

### Exit Gate
- New contributor can run project from docs only
- Project presents as production-grade, not hackathon-grade

---

## Risk Register (Initial)
1. **API key leakage risk** — High
   - Mitigation: server-only secrets, audit env exposure
2. **Build fragility from env assumptions** — High
   - Mitigation: runtime env guards + safer init boundaries
3. **OCR/AI latency and failures** — Medium
   - Mitigation: retry, status tracking, timeout policies
4. **Schema drift** — Medium
   - Mitigation: type generation strategy + migration discipline
5. **Scope creep** — Medium
   - Mitigation: phase gates + change control rules

---

## Project Control Model
- **Cadence:**
  - Daily: async status update (Done / Next / Risks)
  - Weekly: milestone review and scope check
- **Change Control:**
  - Any non-trivial feature enters backlog first
  - Must include effort estimate + impact + priority
- **Definition of Ready (DoR):**
  - Clear acceptance criteria
  - Dependencies identified
- **Definition of Done (DoD):**
  - Code + tests + docs + passing CI

---

## Immediate Action Plan (Next 48h)
1. Implement Phase 0 security/build fixes
2. Add env template + env validation
3. Patch auth sign-out and context handling
4. Run full verification (`lint`, `build`)
5. Open PR with checklist and risk notes

---

## Backlog Snapshot (Prioritized)
- P0: Remove `NEXT_PUBLIC_CEREBRAS_API_KEY` path
- P0: Fix build crash from Supabase env/prerender assumptions
- P0: Align analysis response format + parsing
- P1: Add processing status model for documents
- P1: Add rate limiting + input validation on API
- P2: Queue-based async processing
- P2: Observability and error tracking
- P2: E2E tests + CI quality gate

---

## Notes
This roadmap is intentionally execution-driven: each phase produces visible, reviewable proof of engineering maturity.
