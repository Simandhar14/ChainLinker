import dayjs from 'dayjs';
import { computeDailyPnl } from '../services/pnlService.js';

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const isValidWallet = w => WALLET_REGEX.test(w);

export const getWalletPnl = async (req, res) => {
  const wallet = req.params.wallet.toLowerCase();
  const { start, end } = req.query;
  if (!isValidWallet(wallet))
    return res.status(400).json({ error: 'invalid wallet address' });
  if (!start || !end)
    return res.status(400).json({ error: 'missing start/end date' });
  try {
    const result = await computeDailyPnl(wallet, start, end);
    if (result && result.error) {
      return res.status(500).json(result);
    }
    // Serve raw HL dataset, allow frontend to process
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to calculate PnL' });
  }
};
