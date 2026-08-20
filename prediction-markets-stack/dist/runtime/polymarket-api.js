export class PolymarketGammaClient {
    baseUrl;
    constructor(baseUrl = "https://gamma-api.polymarket.com") {
        this.baseUrl = baseUrl;
    }
    async listEvents(options = {}) {
        const url = new URL(`${this.baseUrl}/events`);
        if (options.limit !== undefined) {
            url.searchParams.set("limit", String(options.limit));
        }
        if (options.active !== undefined) {
            url.searchParams.set("active", String(options.active));
        }
        if (options.closed !== undefined) {
            url.searchParams.set("closed", String(options.closed));
        }
        return this.fetchJson(url);
    }
    async fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "prediction-markets-stack/0.1"
            }
        });
        if (!response.ok) {
            throw new Error(`Polymarket Gamma request failed: ${response.status} ${response.statusText}`);
        }
        return (await response.json());
    }
}
