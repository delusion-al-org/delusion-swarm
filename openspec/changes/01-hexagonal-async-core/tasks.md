# Implementation Task List — Hexagonal Async Core

## Completed
- [x] **Hexagonal Refactor**: Created `adapters/engram` and `adapters/queue` with factory patterns.
- [x] **Async Dispatch**: Implemented `/async/dispatch` endpoint in Hono for fire-and-forget execution.
- [x] **Production Hardening**: Replaced dynamic `require` with ESM-safe patterns for `SqliteAdapter`.
- [x] **Nvidia Throttling**: Implemented `fetchWithRotation` with 1200ms delay and key rotation in `model-factory.ts`.
- [x] **Agent Infrastructure**: Injected `engram-save` and `engram-search` tools into the Orchestrator.
- [x] **E2E Validation**: Created and verified `scripts/mock-webhook.ts`.

## Remaining
- [ ] **Cross-Platform Fix**: Update `bashExec` in Planner to handle both Unix and Windows transparently (Judge A finding).
- [ ] **Persistence Stress Test**: Verify that `.engram-storage/engram.db` survives multiple agent runs.
- [ ] **Judgment Day**: Final adversarial review and approval.
