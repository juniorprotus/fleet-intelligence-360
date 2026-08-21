# FI360 AI AGENT ENTRY POINT

Before making any change to this repository, read:

`FI360-AI-AGENT-GUIDE.md`

This is the primary operating guide for AI agents working on FI360.

The guide defines:

- FI360 architecture
- repository structure
- protected domains
- security boundaries
- tenant isolation
- RBAC
- DataScope
- Entitlements
- Quantitative Limits
- Subscriptions
- Payment Core
- development/test boundaries
- migration rules
- testing rules
- release certification rules
- Surgical Change Control Protocol
- current roadmap

## Mandatory Workflow

1. Read `FI360-AI-AGENT-GUIDE.md`.
2. Inspect current repository state.
3. Inspect relevant architecture documents.
4. Inspect current implementation.
5. Identify the smallest safe change.
6. Check whether a certified domain is affected.
7. Follow the Surgical Change Control Protocol.

## Mandatory Safety Rules

- Do not silently redesign FI360 architecture.
- Do not modify certified domains without justification.
- Do not assume historical reports represent current code.
- Current repository state is runtime truth.
- Report architecture conflicts before broad changes.
- Report blocked verification as BLOCKED, not PASS.
- Never use destructive database commands to solve migration drift.

## Repository Documentation

Primary AI guide:

`./FI360-AI-AGENT-GUIDE.md`

Architecture references remain in their established repository locations.

Step-specific implementation and certification reports remain separate from
the master AI guide.
