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
}
