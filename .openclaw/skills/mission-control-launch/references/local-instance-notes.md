# Local instance notes

These notes capture the Mission Control launch issues already solved on Can's machine.

## Working repo

- `/Users/canozgel-macmini/.openclaw/workspace/celine-mission-control-fork`

## Working start command

```bash
PORT=3000 NEXT_PUBLIC_GATEWAY_OPTIONAL=true pnpm dev
```

## Preferred persistent start command

```bash
mkdir -p .openclaw-run && PORT=3000 NEXT_PUBLIC_GATEWAY_OPTIONAL=true nohup pnpm dev > .openclaw-run/mission-control.log 2>&1 & echo $!
```

## Why this reference exists

Earlier weaker/local-model runs failed to launch Mission Control reliably because they missed a few environment-specific facts:

- `pnpm` was not installed yet
- Corepack was available and could activate pnpm
- native/build packages needed explicit rebuild after install
- the dev server could die when started without persistent logging/backgrounding

## Recovery checklist

1. `node -v`
2. `pnpm -v` or activate pnpm with Corepack
3. `pnpm install` if needed
4. `pnpm rebuild @swc/core esbuild sharp @parcel/watcher unrs-resolver vue-demi`
5. background-launch with `.openclaw-run/mission-control.log`
6. verify port 3000 and inspect logs
