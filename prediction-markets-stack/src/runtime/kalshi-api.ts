import type {
  KalshiApiMarketResponse,
  KalshiApiMarketsResponse,
  KalshiApiOrderbookResponse
} from "../venues/kalshi.js";

export interface KalshiListMarketsOptions {
  cursor?: string;
  limit?: number;
  status?: string;
  seriesTicker?: string;
}

export class KalshiHttpClient {
  constructor(private readonly baseUrl = "https://api.elections.kalshi.com/trade-api/v2") {}

  async listMarkets(options: KalshiListMarketsOptions = {}): Promise<KalshiApiMarketsResponse> {
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
    return this.fetchJson<KalshiApiMarketsResponse>(url);
  }

  async getMarket(ticker: string): Promise<KalshiApiMarketResponse> {
    return this.fetchJson<KalshiApiMarketResponse>(`${this.baseUrl}/markets/${encodeURIComponent(ticker)}`);
  }

  async getOrderbook(ticker: string): Promise<KalshiApiOrderbookResponse> {
    return this.fetchJson<KalshiApiOrderbookResponse>(
      `${this.baseUrl}/markets/${encodeURIComponent(ticker)}/orderbook`
    );
  }

  private async fetchJson<T>(url: string | URL): Promise<T> {
    const response = await fetch(url, {
      headers: {
        accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Kalshi API request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }
}
