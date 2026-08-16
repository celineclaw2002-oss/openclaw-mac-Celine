export function deterministicKey(parts) {
    return parts.map(String).join("::");
}
