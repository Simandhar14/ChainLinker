import { fetchUserFills, fetchUserState, fetchMeta, fetchUserFees } from './hyperliquidService.js';

export async function computeDailyPnl(wallet, start, end) {
  let fills = [], userState = null, meta = null, fees = null;
  const fetchWrappers = [
    () => fetchUserFills(wallet),
    () => fetchUserState(wallet),
    () => fetchMeta(),
    () => fetchUserFees(wallet)
  ];
  const results = await Promise.allSettled(fetchWrappers.map(fn => fn()));
  if (results[0].status === "fulfilled") fills = results[0].value; else fills = [];
  if (results[1].status === "fulfilled") userState = results[1].value; else userState = {};
  if (results[2].status === "fulfilled") meta = results[2].value; else meta = {};
  if (results[3].status === "fulfilled") fees = results[3].value; else fees = {};

  const everythingFailed = results.every(r => r.status !== 'fulfilled');
  if (everythingFailed) {
    return { error: 'No data could be fetched from Hyperliquid.' };
  }
  const positions = userState?.perpetualPositions || [];
  const accountValue = userState?.marginSummary?.accountValue || null;
  const feeSummary = userState?.feeSummary || fees || {};
  return {
    fills,
    positions,
    fees: feeSummary,
    userFees: fees,
    equity: accountValue,
    meta
  };
}
