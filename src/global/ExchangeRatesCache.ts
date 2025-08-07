import createHttpError from "http-errors";

class ExchangeRatesCache {
  rates: Record<string, number>;
  nextFetch?: Date;
  private API_URL: string;

  constructor(API_URL: string) {
    this.API_URL = API_URL;
    this.rates = {};
  }

  async update() {
    console.log("-> Updating Exchange Rates");

    try {
      const res = await fetch(this.API_URL);
      const data = await res.json();
      this.rates = data.conversion_rates;
      this.nextFetch = new Date(data.time_next_update_utc);
    } catch (error) {
      console.error(error);
    }
  }

  async get(curr: string | undefined) {
    if (!curr) {
      throw createHttpError(400, "No currency provided in cookies");
    }

    curr = curr.toUpperCase();

    if (
      Object.keys(this.rates).length === 0 ||
      !this.nextFetch ||
      new Date() >= this.nextFetch
    ) {
      await this.update();
    }

    if (this.rates[curr] === undefined)
      throw createHttpError(400, "Invalid currency provided: ", curr);
    return this.rates[curr];
  }
}

export default ExchangeRatesCache;
