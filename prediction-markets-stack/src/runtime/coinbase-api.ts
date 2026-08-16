export interface CoinbaseTickerResponse {
  ask: string;
  bid: string;
  price: string;
  size: string;
  time: string;
  trade_id: number;
  volume: string;
}

export interface CoinbaseTickerRecord {
  productId: string;
  price: number;
  bid: number;
  ask: number;
  size: number;
  volume: number;
  tradeId: number;
  time: string;
}

export class CoinbaseHttpClient {
  constructor(private readonly baseUrl = "https://api.exchange.coinbase.com") {}

  async getTicker(productId = "BTC-USD"): Promise<CoinbaseTickerRecord> {
    const response = await fetch(`${this.baseUrl}/products/${productId}/ticker`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "prediction-markets-stack/0.1"
      }
    });
    if (!response.ok) {
      throw new Error(`Coinbase ticker request failed with status ${response.status}.`);
    }
    const payload = (await response.json()) as CoinbaseTickerResponse;
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
