import { fetchTokenData } from '../services/coingeckoService.js';
import { callModel } from '../services/aiService.js';

export const getTokenInsight = async (req, res) => {
  const { id } = req.params;
  const { vs_currency, history_days } = req.body || {};

  if (!id) return res.status(400).json({ error: 'missing token id' });

  try {
    // get token info from coingecko
    const token = await fetchTokenData(id, { vs_currency, history_days });

    // Build prompt for the AI. you could make this as fancy as you want
    const prompt = `Given this token data:\nName: ${token.name}\nSymbol: ${token.symbol}\nPrice (USD): ${token.market_data.current_price_usd}\nMarket Cap: ${token.market_data.market_cap_usd}\n24h Change: ${token.market_data.price_change_percentage_24h}\nGive a JSON summary like: {\"reasoning\": ..., \"sentiment\": ...}`;

    // call ai (real or mock)
    let aiRaw;
    try {
      aiRaw = await callModel(prompt, {
        provider: process.env.AI_PROVIDER || 'mock',
        model: 'gpt-4.1'
      });
    } catch (err) {
      // ai failed, fallback
      aiRaw = '{"reasoning":"AI unavailable","sentiment":"Unknown"}';
    }

    // try to robust-parse it (if string, might be valid JSON or wrapped in other stuff)
    let aiInsight = aiRaw;
    if (typeof aiInsight === 'string') {
      try {
        aiInsight = JSON.parse(aiInsight);
      } catch (e) {
        // try to grab inner json block
        const match = aiInsight.match(/\{[\s\S]*\}/);
        aiInsight = match ? JSON.parse(match[0]) : { reasoning: 'parse fail', sentiment: 'Unknown' };
      }
    }

    return res.json({
      source: 'coingecko',
      token,
      insight: aiInsight,
      model: { provider: process.env.AI_PROVIDER || 'mock', model: 'gpt-4.1' }
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
};
