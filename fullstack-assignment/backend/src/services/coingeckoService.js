// okay, this will hit the coingecko API for real token data now
import axios from 'axios';

export async function fetchTokenData(id, opts = {}) {
  const { vs_currency = 'usd', history_days = 30 } = opts;
  const API_KEY = process.env.COINGECKO_API_KEY;

  if (!API_KEY) throw new Error('missing CoinGecko API key');
  try {
    // hit the /coins/{id} endpoint
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}`;
    const resp = await axios.get(url, {
      headers: {
        'x-cg-pro-api-key': API_KEY
      }
    });
    const data = resp.data;
    // you could optionally fetch market_chart for extra history, but this is the required call
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      market_data: {
        current_price_usd: data.market_data?.current_price?.usd ?? null,
        market_cap_usd: data.market_data?.market_cap?.usd ?? null,
        total_volume_usd: data.market_data?.total_volume?.usd ?? null,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h ?? null
      }
    };
  } catch (err) {
    // something went wrong
    //console.error('CoinGecko fetch failed:', err?.message);
    throw new Error('CoinGecko fetch failed: ' + (err.response?.data?.error || err.message));
  }
}
