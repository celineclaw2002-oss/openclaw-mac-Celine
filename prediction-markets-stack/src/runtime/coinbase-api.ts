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

export type CoinbaseCandleTuple = [
  time: number,
  low: number,
  high: number,
  open: number,
  close: number,
  volume: number
];

export interface CoinbaseDailyCandleRecord {
  timeMs: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
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

  async getCandles(options: {
    productId?: string;
    startIso: string;
    endIso: string;
    granularitySeconds?: 60 | 300 | 900 | 3600 | 21600 | 86400;
  }): Promise<CoinbaseDailyCandleRecord[]> {
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
    const payload = (await response.json()) as CoinbaseCandleTuple[];
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
