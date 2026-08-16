export class KalshiHttpClient {
    baseUrl;
    constructor(baseUrl = "https://api.elections.kalshi.com/trade-api/v2") {
        this.baseUrl = baseUrl;
    }
    async listMarkets(options = {}) {
        const url = new URL(`${this.baseUrl}/markets`);
        if (options.cursor) {
            url.searchParams.set("cursor", options.cursor);
        }
        if (options.limit) {
            url.searchParams.set("limit", String(options.limit));
        }
        if (options.status) {
            url.searchParams.set("status", options.status);
        }
        if (options.seriesTicker) {
            url.searchParams.set("series_ticker", options.seriesTicker);
        }
        return this.fetchJson(url);
    }
    async getMarket(ticker) {
        return this.fetchJson(`${this.baseUrl}/markets/${encodeURIComponent(ticker)}`);
    }
    async getOrderbook(ticker) {
        return this.fetchJson(`${this.baseUrl}/markets/${encodeURIComponent(ticker)}/orderbook`);
    }
    async getSeries(seriesTicker) {
        return this.fetchJson(`${this.baseUrl}/series/${encodeURIComponent(seriesTicker)}`);
    }
    async getEvent(eventTicker) {
        return this.fetchJson(`${this.baseUrl}/events/${encodeURIComponent(eventTicker)}`);
    }
    async fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                accept: "application/json"
            }
        });
        if (!response.ok) {
            throw new Error(`Kalshi API request failed: ${response.status} ${response.statusText}`);
        }
        return (await response.json());
    }
}
