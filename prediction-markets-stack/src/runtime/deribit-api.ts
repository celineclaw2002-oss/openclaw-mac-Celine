export interface DeribitInstrumentRecord {
  instrument_name: string;
  kind: "future" | "option" | string;
  option_type?: "call" | "put" | string;
  expiration_timestamp: number;
  strike?: number;
  settlement_period?: string;
  base_currency: string;
  quote_currency: string;
  tick_size?: number;
}

export interface DeribitBookSummaryRecord {
  instrument_name: string;
  ask_price?: number | null;
  bid_price?: number | null;
  mid_price?: number | null;
  open_interest?: number | null;
  volume?: number | null;
  underlying_price?: number | null;
  mark_price?: number | null;
  creation_timestamp?: number | null;
}

interface DeribitApiResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
}

export class DeribitHttpClient {
  constructor(private readonly baseUrl = "https://www.deribit.com/api/v2") {}

  async getInstruments(currency: "BTC", kind: "future" | "option"): Promise<DeribitInstrumentRecord[]> {
    return this.fetchResult<DeribitInstrumentRecord[]>(
      `/public/get_instruments?currency=${currency}&kind=${kind}&expired=false`
    );
  }

  async getBookSummaryByCurrency(
    currency: "BTC",
    kind: "future" | "option"
  ): Promise<DeribitBookSummaryRecord[]> {
    return this.fetchResult<DeribitBookSummaryRecord[]>(
      `/public/get_book_summary_by_currency?currency=${currency}&kind=${kind}`
    );
  }

  private async fetchResult<T>(pathWithQuery: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${pathWithQuery}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "prediction-markets-stack/0.1"
      }
    });
    if (!response.ok) {
      throw new Error(`Deribit request failed with status ${response.status}.`);
    }
    const payload = (await response.json()) as DeribitApiResponse<T>;
    return payload.result;
  }
}
