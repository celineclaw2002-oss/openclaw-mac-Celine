export class CoinbaseHttpClient {
    baseUrl;
    constructor(baseUrl = "https://api.exchange.coinbase.com") {
        this.baseUrl = baseUrl;
    }
    async getTicker(productId = "BTC-USD") {
        const response = await fetch(`${this.baseUrl}/products/${productId}/ticker`, {
            headers: {
                Accept: "application/json",
                "User-Agent": "prediction-markets-stack/0.1"
            }
        });
        if (!response.ok) {
            throw new Error(`Coinbase ticker request failed with status ${response.status}.`);
        }
        const payload = (await response.json());
        return {
            productId,
            price: Number(payload.price),
            bid: Number(payload.bid),
            ask: Number(payload.ask),
            size: Number(payload.size),
            volume: Number(payload.volume),
            tradeId: payload.trade_id,
            time: payload.time
        };
    }
    async getCandles(options) {
        const productId = options.productId ?? "BTC-USD";
        const granularitySeconds = options.granularitySeconds ?? 86400;
        const url = new URL(`${this.baseUrl}/products/${productId}/candles`);
        url.searchParams.set("start", options.startIso);
        url.searchParams.set("end", options.endIso);
        url.searchParams.set("granularity", String(granularitySeconds));
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "prediction-markets-stack/0.1"
            }
        });
        if (!response.ok) {
            throw new Error(`Coinbase candles request failed with status ${response.status}.`);
        }
        const payload = (await response.json());
        return payload
            .map((row) => ({
            timeMs: row[0] * 1000,
            low: row[1],
            high: row[2],
            open: row[3],
            close: row[4],
            volume: row[5]
        }))
            .sort((left, right) => left.timeMs - right.timeMs);
    }
}
