# Builderz Forbidden Actions List

These actions are off-limits during early Builderz evaluation unless Can explicitly approves them.

## Absolutely forbidden during initial testing

- Do not run `doctor fix` or any repair flow.
- Do not point Builderz at the real live `~/.openclaw` state first.
- Do not allow Builderz to auto-repair, auto-provision, or auto-migrate anything.
- Do not install or enable persistent services on the host.
- Do not expose Builderz publicly.
- Do not connect Builderz to the live gateway first.
- Do not install skills from inside Builderz.
- Do not let Builderz rewrite shell configuration.
- Do not let Builderz modify launch agents, startup behavior, or system services.
- Do not grant elevated privileges casually.
- Do not test destructive or cleanup actions on real state.

## Only allowed later, with explicit approval

- Testing against a copied throwaway OpenClaw state directory.
- Testing gateway integration in a controlled environment.
- Testing write-capable modules after read-only behavior is understood.
- Evaluating whether to fork and strip risky setup behavior.

## Default posture

If Builderz offers a convenience action that changes state, assume the answer is no until reviewed.
