export interface PolymarketMarketRecord {
  id: string;
  question: string;
  slug: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  acceptingOrders?: boolean;
  enableOrderBook?: boolean;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  liquidityNum?: number;
  volume24hr?: number;
  volume1wk?: number;
  volumeClob?: number;
  feeType?: string;
  orderPriceMinTickSize?: number;
  orderMinSize?: number;
  restricted?: boolean;
}

export interface PolymarketEventRecord {
  id: string;
  slug: string;
  title: string;
  active?: boolean;
  closed?: boolean;
  liquidity?: number;
  volume24hr?: number;
  volume1wk?: number;
  restricted?: boolean;
  markets?: PolymarketMarketRecord[];
}

export interface PolymarketListEventsOptions {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
}

export class PolymarketGammaClient {
  constructor(private readonly baseUrl = "https://gamma-api.polymarket.com") {}

  async listEvents(options: PolymarketListEventsOptions = {}): Promise<PolymarketEventRecord[]> {
    const url = new URL(`${this.baseUrl}/events`);
    if (options.limit !== undefined) {
      url.searchParams.set("limit", String(options.limit));
    }
    if (options.offset !== undefined) {
      url.searchParams.set("offset", String(options.offset));
    }
    if (options.active !== undefined) {
      url.searchParams.set("active", String(options.active));
    }
    if (options.closed !== undefined) {
      url.searchParams.set("closed", String(options.closed));
    }
    return this.fetchJson<PolymarketEventRecord[]>(url);
  }

  private async fetchJson<T>(url: string | URL): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "prediction-markets-stack/0.1"
      }
    });
    if (!response.ok) {
      throw new Error(`Polymarket Gamma request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }
}
