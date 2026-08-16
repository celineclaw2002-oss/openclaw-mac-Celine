export class DeribitHttpClient {
    baseUrl;
    constructor(baseUrl = "https://www.deribit.com/api/v2") {
        this.baseUrl = baseUrl;
    }
    async getInstruments(currency, kind) {
        return this.fetchResult(`/public/get_instruments?currency=${currency}&kind=${kind}&expired=false`);
    }
    async getBookSummaryByCurrency(currency, kind) {
        return this.fetchResult(`/public/get_book_summary_by_currency?currency=${currency}&kind=${kind}`);
    }
    async fetchResult(pathWithQuery) {
        const response = await fetch(`${this.baseUrl}${pathWithQuery}`, {
            headers: {
                Accept: "application/json",
                "User-Agent": "prediction-markets-stack/0.1"
            }
        });
        if (!response.ok) {
            throw new Error(`Deribit request failed with status ${response.status}.`);
        }
        const payload = (await response.json());
        return payload.result;
    }
}
