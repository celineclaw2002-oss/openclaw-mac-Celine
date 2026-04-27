# Mission Control Vault integration

## What we decided
- Treat Mission Control Vault as the default shared operational memory substrate for agents when Vault tooling is available.
- Prefer `mc_vault_*` tools over legacy `mc_*knowledge*` tools for shared project, task, and operational knowledge.
- Keep agent-facing curation actions (`mc_vault_distill`, `mc_vault_promote`, `mc_vault_supersede`) off by default unless explicitly enabled with `MC_MCP_VAULT_CURATION_ENABLED=1`.
- Roll out in a bounded way: deploy updated Mission Control first, verify live surfaces, then steer agent behavior.

## What was accomplished
- Independently re-audited Claude's Phase 6/8 Vault claims against the real repo branch `claude/approve-phase-6-slice-AnezD`.
- Verified targeted Vault acceptance/typecheck evidence and separated Vault readiness from repo-wide health.
- Confirmed local Mission Control repo was updated to commit `9d91420`.
- Confirmed local Mission Control dev server is running on `http://127.0.0.1:3020`.
- Restarted the local dev server from the updated branch so it is serving current code.
- Confirmed Vault-native files and MCP tool names exist in code, including:
  - `src/app/api/vault/notes/route.ts`
  - `src/lib/vault-agent-note-service.ts`
  - `mc_vault_capture_note`
  - `mc_vault_search`
  - `mc_vault_read`
  - `mc_vault_knowledge`
  - `mc_vault_retrieval`
  - `mc_vault_family`
- Updated workspace guidance so agents prefer Mission Control Vault when available:
  - `SOUL.md`
  - `USER.md`
- Committed that guidance change in the workspace as `062536f` (`docs: steer agents toward Mission Control Vault`).

## Live verification status
- The local app is reachable and serves the login page at `http://127.0.0.1:3020`.
- Direct unauthenticated API probing is blocked by Mission Control auth:
  - root redirects to `/login` when not authenticated
  - Vault API calls return `Unauthorized` without auth
- So live end-to-end Vault route verification is still blocked until an authenticated session is available to reuse or the operator manually signs in and checks specific flows.

## Important commands, files, and links
- Repo: `/Users/canozgel-macmini/.openclaw/workspace/celine-mission-control`
- Local app URL: `http://127.0.0.1:3020`
- Branch: `claude/approve-phase-6-slice-AnezD`
- Current verified local commit: `9d91420`
- Guidance files updated:
  - `/Users/canozgel-macmini/.openclaw/workspace/SOUL.md`
  - `/Users/canozgel-macmini/.openclaw/workspace/USER.md`
- Topic file: `/Users/canozgel-macmini/.openclaw/workspace/topics/mission-control-vault-integration.md`

## Open questions / risks
- We still need authenticated live verification that the new Vault note path works in the running app, not just in code/tests.
- Agents may still use legacy `mc_*knowledge*` tools in practice until deployed prompts/tool habits catch up.
- Repo-wide full test-green remains false in this environment due to two non-Vault failures.

## Next steps
1. While signed into Mission Control, verify a live Vault-native action path:
   - create or inspect a Vault note
   - if possible, exercise `mc_vault_capture_note` through the real agent path
   - verify operator visibility in the UI
2. Confirm a later task/retrieval flow resurfaces the same artifact usefully.
3. Decide whether any specialist-agent prompts need more explicit Vault steering beyond the shared SOUL/USER guidance.
4. Keep curation tools off initially unless there is a strong reason to enable `MC_MCP_VAULT_CURATION_ENABLED=1`.
