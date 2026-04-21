---
name: mission-control-launch
description: Launch, relaunch, or debug the local Builderz Mission Control instance in Can's OpenClaw workspace. Use when asked to open Mission Control, run a local Mission Control server, restart a crashed instance, inspect why it is not loading, or get the local URL/setup path working again.
---

# Mission Control Launch

Launch the local Mission Control repo reliably, using the known workspace location and the exact bootstrap steps that worked on this machine.

## Repo and expected URL

- Repo path: `/Users/canozgel-macmini/.openclaw/workspace/celine-mission-control-fork`
- Preferred local URL: `http://127.0.0.1:3000`
- First-run setup URL: `http://127.0.0.1:3000/setup`

## Workflow

1. Confirm the repo exists and inspect `README.md` and `package.json` if launch behavior is unclear.
2. Check Node and pnpm:
   - `node -v`
   - `pnpm -v`
3. If `pnpm` is missing, enable it with Corepack:
   - `corepack enable && corepack prepare pnpm@latest --activate`
4. If `node_modules` is missing, run:
   - `pnpm install`
5. If pnpm warns that build scripts were ignored, rebuild the required packages:
   - `pnpm rebuild @swc/core esbuild sharp @parcel/watcher unrs-resolver vue-demi`
6. Start Mission Control with gateway-optional enabled:
   - foreground dev: `PORT=3000 NEXT_PUBLIC_GATEWAY_OPTIONAL=true pnpm dev`
   - preferred persistent background launch:
     `mkdir -p .openclaw-run && PORT=3000 NEXT_PUBLIC_GATEWAY_OPTIONAL=true nohup pnpm dev > .openclaw-run/mission-control.log 2>&1 & echo $!`
7. Verify it is listening:
   - `lsof -nP -iTCP:3000 -sTCP:LISTEN`
   - `tail -n 80 .openclaw-run/mission-control.log`
8. If it is up, send the user the local URL and mention `/setup` for a fresh instance.

## Known-good defaults for this machine

- Node 22 is available and required.
- `pnpm` may not be preinstalled, but Corepack works.
- Dev server command from `package.json` binds to `127.0.0.1` on port `3000`.
- `NEXT_PUBLIC_GATEWAY_OPTIONAL=true` lets the UI come up even when gateway integration is incomplete.

## Common failure modes

### `pnpm: command not found`

Use:

```bash
corepack enable && corepack prepare pnpm@latest --activate
```

### Install succeeded but native/web build pieces were skipped

If pnpm reports ignored build scripts, run:

```bash
pnpm rebuild @swc/core esbuild sharp @parcel/watcher unrs-resolver vue-demi
```

### Server was running and then disappeared

The dev server may exit silently when launched in a normal exec session. Prefer background launch with log capture:

```bash
mkdir -p .openclaw-run && PORT=3000 NEXT_PUBLIC_GATEWAY_OPTIONAL=true nohup pnpm dev > .openclaw-run/mission-control.log 2>&1 & echo $!
```

Then inspect:

```bash
tail -n 100 .openclaw-run/mission-control.log
```

### Port 3000 is not listening

Check whether the process died:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
```

If needed, restart the app with the background launch command above.

## Important notes

- Do not assume `pnpm` exists.
- Do not tell the user to figure out the launch steps manually when you can run them.
- Prefer persistent background launch plus logs over a fragile foreground dev session.
- If the repo has changed significantly, re-read `README.md` and `package.json` before guessing.
- If a repo-wide `pnpm build` fails, do not assume the launch fix failed. Dev mode may still run. Verify the running server separately.
