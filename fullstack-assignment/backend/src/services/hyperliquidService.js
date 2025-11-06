import axios from 'axios';

const HL_API = 'https://api.hyperliquid.xyz/info';

async function hlPost(body) {
  try {
    const resp = await axios.post(HL_API, body, { timeout: 8000 });
    if (!resp.data || resp.data.error) throw new Error(resp.data.error || 'Empty response');
    return resp.data;
  } catch (err) {
    throw new Error('HyperLiquid API error: ' + (err.response?.data?.error || err.message));
  }
}

export async function fetchUserFills(wallet) {
  return hlPost({ type: 'userFills', user: wallet });
}

export async function fetchUserState(wallet) {
  return hlPost({ type: 'userState', user: wallet });
}
export async function fetchMeta() {
  return hlPost({ type: 'meta' });
}
export async function fetchUserFees(wallet) {
  return hlPost({ type: 'userFees', user: wallet });
}
