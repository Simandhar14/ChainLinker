import React, { useState } from 'react';

function TokenLogo({ symbol, size = 42 }) {
  let url = '';
  if (symbol) {
    url = `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`;
    if (symbol.toLowerCase() === 'link')
      url = 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png';
    if (symbol.toLowerCase() === 'eth')
      url = 'https://assets.coingecko.com/coins/images/279/large/ethereum.png';
    if (symbol.toLowerCase() === 'btc')
      url = 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png';
    // ...add more as needed, fallback below.
  }
  return (
    <span style={{display: 'inline-block', verticalAlign: 'middle'}}>
      <img 
        src={url} 
        width={size} height={size} 
        alt={symbol || 'token'} 
        style={{borderRadius: '50%', border: '2px solid #191919', background: '#fff', objectFit: 'cover'}} 
        onError={e => {e.target.style.display='none';}} />
    </span>
  );
}

function Card({ children, style }) {
  return <div style={{
    background: '#101114',
    padding: '38px 35px 38px 35px',
    borderRadius: 12,
    margin: '34px 0',
    maxWidth: 780,
    minWidth: 580,
    width: '98%',
    boxShadow: '0 3px 24px #0004',
    ...style
  }}>{children}</div>;
}

export default function App() {
  // frontend state ...
  const [tokenId, setTokenId] = useState('chainlink');
  const [vsCurrency, setVsCurrency] = useState('usd');
  const [historyDays, setHistoryDays] = useState(30);
  const [tokenResult, setTokenResult] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [wallet, setWallet] = useState('');
  const [start, setStart] = useState('2025-08-01');
  const [end, setEnd] = useState('2025-08-03');
  const [pnlResult, setPnlResult] = useState(null);
  // just checking wallet format here
  const [walletFormatError, setWalletFormatError] = useState('');
  const [dailyPnl, setDailyPnl] = useState([]);
  const [unrealizedPositions, setUnrealizedPositions] = useState([]);

  const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setTokenResult(null); setTokenError('');
    try {
      const res = await fetch(`/api/token/${tokenId}/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vs_currency: vsCurrency, history_days: historyDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error fetching token insight');
      setTokenResult(data);
    } catch (err) {
      setTokenError(err.message || 'unknown error');
    }
  };
  const handlePnlSubmit = async (e) => {
    e.preventDefault();
    setDailyPnl([]);
    if (!WALLET_REGEX.test(wallet)) {
      setWalletFormatError('Please enter a valid wallet address');
      return;
    } else {
      setWalletFormatError('');
    }
    try {
      const params = new URLSearchParams({ start, end }).toString();
      const res = await fetch(`/api/hyperliquid/${wallet}/pnl?${params}`);
      const data = await res.json();
      if (data && data.error) {
        setDailyPnl([]);
        return;
      }
      const { fills = [], userFees = {}, positions = [], meta = {} } = data;
      // === Fills aggregation (by day): ===
      let daily = [];
      if (Array.isArray(fills) && fills.length > 0) {
        const startMs = new Date(start).setHours(0,0,0,0);
        const endMs = new Date(end).setHours(23,59,59,999);
        const filteredFills = fills.filter(f => f.time >= startMs && f.time <= endMs);
        // Group fills by day
        const fillsByDay = {};
        filteredFills.forEach(fill => {
          const date = new Date(fill.time).toISOString().slice(0,10);
          if (!fillsByDay[date]) fillsByDay[date] = [];
          fillsByDay[date].push(fill);
        });
        daily = Object.entries(fillsByDay).map(([date, fills]) => {
          let realized = 0, fees = 0, funding = 0, unrealized = 0;
          fills.forEach(f => {
            realized += Number(f.closedPnl || 0);
            fees += Number(f.fee || 0);
          });
          const net = realized + unrealized - fees + funding; // unrealized, funding stubbed 0
          return { date, realized, unrealized, fees, funding, net };
        });
      }
      setDailyPnl(daily);
      // --- Fallback for open positions if no fills per period ---
      let unrealizedPos = [];
      if (
        (!Array.isArray(fills) || fills.length === 0) &&
        Array.isArray(positions) && positions.length > 0 &&
        meta && Object.keys(meta).length > 0
      ) {
        positions.forEach(pos => {
          const sym = pos.coin;
          const entryPx = Number(pos.entryPx);
          const sz = Number(pos.sz);
          const side = sz > 0 ? 'Long' : 'Short';
          const pxData = meta[sym] || {};
          const markPx = pxData.markPrice || pxData.oraclePrice || null;
          let unrealized = null;
          if (markPx !== null && !isNaN(entryPx) && !isNaN(sz)) {
            unrealized = (markPx - entryPx) * sz;
          }
          unrealizedPos.push({
            sym, sz, side, entryPx,
            currentPx: markPx, unrealized: unrealized
          });
        });
      }
      setUnrealizedPositions(unrealizedPos);
      // Always store the whole original response in result state for summary display (optional)
      setPnlResult(data);
    } catch (err) {
      setDailyPnl([]);
    }
  };
  const main = {
    background: '#18181c', minHeight: '100vh', margin: 0,
    fontFamily: 'Orbitron, system-ui, sans-serif', color: '#ceffee',
    WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', padding: 0
  };
  const wrapper = {
    maxWidth: 880, margin: '44px auto', padding: '28px 34px 24px 34px',
    background: '#18181c', borderRadius: 0, border: 'none', boxShadow: 'none', minWidth: 340
  };
  const input = {
    padding: '12px 14px', marginBottom: 13, border: '1.5px solid #34374c',
    borderRadius: 0, background: '#14151d', color: '#a7f6ef', width: '100%',
    marginTop: 6, fontSize: 15, fontFamily: 'Orbitron', letterSpacing: '0.02em',
    outline: 'none', boxShadow: 'none', transition: 'border .2s',
  };
  const label = { fontWeight: 700, marginTop: 14, display: 'block', fontSize: 15, color: '#3bffcc', letterSpacing: '.05em', fontFamily: 'Orbitron' };
  const button = {
    marginTop: 13, padding: '12px 26px', borderRadius: 0,
    background: 'linear-gradient(90deg, #02ffb0 20%, #0079fa 100%)', color: '#19181c',
    border: 0, fontWeight: 700, cursor: 'pointer', fontSize: 16, fontFamily: 'Orbitron',
    letterSpacing: '.15em', textTransform: 'uppercase', boxShadow: 'none', transition: 'background .18s',
  };
  const heading = {
    margin: 0, marginBottom: 6, fontSize: 28, letterSpacing: '0.11em',
    fontFamily: 'Orbitron', fontWeight: 700, textTransform: 'uppercase',
  };
  return (
    <div style={main}>
      <div style={wrapper}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 17 }}>
          <TokenLogo symbol={tokenResult?.token?.symbol || 'btc'} size={52}/>
          <h1 style={heading}>Token & PnL Demo</h1>
        </div>
        {/* Token Insight Form */}
        <form onSubmit={handleTokenSubmit} style={{marginBottom: 12}}>
          <h3 style={{marginBottom: 5, fontSize: 18, fontWeight: 700, color: '#5cfff9', letterSpacing: '.11em', fontFamily: 'Orbitron', textTransform: 'uppercase'}}>Token Insight</h3>
          <label style={label}>Token ID
            <input value={tokenId} onChange={e => setTokenId(e.target.value)} style={input} placeholder="token id (e.g. chainlink)" />
          </label>
          <label style={label}>vs_currency
            <input value={vsCurrency} onChange={e => setVsCurrency(e.target.value)} style={input} placeholder="usd" />
          </label>
          <label style={label}>history_days
            <input type="number" value={historyDays} onChange={e => setHistoryDays(e.target.value)} style={input} placeholder="history_days (30)"/>
          </label>
          <button style={button} type="submit">Get Insight</button>
          {tokenError && <div style={{ color: '#ef4545', marginTop: 10, fontWeight: 600, fontFamily: 'Orbitron' }}>Err: {tokenError}</div>}
        </form>
        {tokenResult && (
          <Card>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <TokenLogo symbol={tokenResult.token?.symbol} size={42} />
              <div>
                <div style={{fontSize: 19, fontWeight: 700, color: '#a3ffe9'}}>{tokenResult.token?.name} <span style={{fontSize: 16, color: '#45faff'}}>({tokenResult.token?.symbol?.toUpperCase()})</span></div>
                <div style={{marginTop: 4, fontSize: 14}}>Price: $<b>{tokenResult.token?.market_data?.current_price_usd?.toLocaleString() ?? '?'}</b></div>
                <div style={{fontSize: 14}}>Market Cap: ${tokenResult.token?.market_data?.market_cap_usd?.toLocaleString() ?? '?'}</div>
                <div style={{fontSize: 14}}>24h Change: <span style={{color: (tokenResult.token?.market_data?.price_change_percentage_24h ?? 0) >= 0 ? '#8bfa8b' : '#ff6b6b'}}>{tokenResult.token?.market_data?.price_change_percentage_24h}%</span></div>
              </div>
            </div>
            <div style={{margin: '17px 0 5px 0', color: '#77f', fontWeight: 700}}>AI Insight:</div>
            <div style={{fontSize: 15, color: '#cfd7ff'}}><b>Reasoning:</b> {tokenResult.insight?.reasoning}</div>
            <div style={{fontSize: 15, color: '#fefd78'}}><b>Sentiment:</b> {tokenResult.insight?.sentiment}</div>
          </Card>
        )}
        {/* Wallet PnL Form */}
        <form onSubmit={handlePnlSubmit}>
          <h3 style={{marginBottom: 5, fontSize: 18, fontWeight: 700, color: '#5cfff9', letterSpacing: '.11em', fontFamily: 'Orbitron', textTransform: 'uppercase'}}>Wallet PnL</h3>
          <label style={label}>Wallet
            <input value={wallet} onChange={e => setWallet(e.target.value)} style={input} placeholder="wallet address" />
          </label>
          {/* Show wallet validation message */}
          {walletFormatError && <div style={{ color: '#ef4545', marginTop: -3, fontWeight: 600, fontFamily: 'Orbitron', fontSize: 13 }}>{walletFormatError}</div>}
          <label style={label}>Start date
            <input value={start} onChange={e => setStart(e.target.value)} style={input} placeholder="start (YYYY-MM-DD)"/>
          </label>
          <label style={label}>End date
            <input value={end} onChange={e => setEnd(e.target.value)} style={input} placeholder="end (YYYY-MM-DD)"/>
          </label>
          <button style={button} type="submit">Get PnL</button>
        </form>
        {/* Show message if no daily result, else show table */}
        {dailyPnl.length > 0 && (
          <Card style={{maxWidth: 840, minWidth: 540, width: '100%', padding: '40px 25px'}}>
            <div style={{fontSize: 18, fontWeight: 800, marginBottom: 12, marginTop: 5}}>Trading Days: {dailyPnl.length}</div>
            <table style={{borderCollapse: 'collapse', width: 900, minWidth: 350, fontFamily: 'Orbitron', background: 'none', color: '#e1e7fd', margin: '0 auto'}}>
              <thead>
                <tr style={{background: '#24273a', textAlign: 'left', fontSize: 15}}>
                  <th style={{padding: '10px 20px'}}>Date</th>
                  <th style={{padding: '10px 20px'}}>Realized</th>
                  <th style={{padding: '10px 20px'}}>Unrealized</th>
                  <th style={{padding: '10px 20px'}}>Fees</th>
                  <th style={{padding: '10px 20px'}}>Funding</th>
                  <th style={{padding: '10px 20px'}}>Net</th>
                </tr>
              </thead>
              <tbody>
                {dailyPnl.map((d, i) => (
                  <tr key={d.date} style={{background: i % 2 ? '#101416' : 'none'}}>
                    <td style={{padding: '10px 20px'}}>{d.date}</td>
                    <td style={{padding: '10px 20px'}}>{d.realized}</td>
                    <td style={{padding: '10px 20px'}}>{d.unrealized}</td>
                    <td style={{padding: '10px 20px'}}>{d.fees}</td>
                    <td style={{padding: '10px 20px'}}>{d.funding}</td>
                    <td style={{padding: '10px 20px', color: d.net >= 0 ? '#a8facc':'#faadad'}}>{d.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {dailyPnl.length === 0 && unrealizedPositions.length > 0 && (
          <Card style={{maxWidth: 840, minWidth: 540, width: '100%', padding: '30px 25px', background:'#151928'}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:12,color:'#f7f090'}}>Open Positions (Unrealized PnL)</div>
            <table style={{width:'100%',color:'#edfeab'}}>
              <thead><tr>
                <th>Symbol</th><th>Side</th><th>Size</th><th>Entry</th><th>Current</th><th>Unrealized PnL</th>
              </tr></thead>
              <tbody>
                {unrealizedPositions.map((p,i)=>(
                  <tr key={p.sym+i}>
                    <td>{p.sym}</td><td>{p.side}</td><td>{p.sz}</td>
                    <td>{p.entryPx}</td><td>{p.currentPx !== null ? p.currentPx : 'n/a'}</td>
                    <td style={{color: Number(p.unrealized) >= 0 ? '#66d96b':'#ef5454'}}>
                      {p.unrealized !== null ? p.unrealized.toFixed(2) : 'n/a'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {pnlResult && pnlResult.userFees && pnlResult.userFees.dailyUserVlm && (
    <Card style={{maxWidth: 840, minWidth: 540, width: '100%', padding: '30px 25px', background:'#151928'}}>
      <div style={{fontSize:17,fontWeight:700,marginBottom:12,color:'#72f0f5'}}> Exchange Volume & Fee Schedule</div>
      <table style={{borderCollapse:'collapse',width:800,maxWidth:'100%',fontFamily:'Orbitron',background:'none',color:'#c9ecee',margin:'0 auto',fontSize:14}}>
        <thead><tr style={{background:'#313a4b',fontWeight:800}}>
          <th style={{padding:'8px 10px'}}>Date</th>
          <th style={{padding:'8px 10px'}}>Cross Vol</th>
          <th style={{padding:'8px 10px'}}>Add Vol</th>
          <th style={{padding:'8px 10px'}}>Exchange Vol</th>
        </tr></thead>
        <tbody>
          {pnlResult.userFees.dailyUserVlm.map(row => (
            <tr key={row.date} style={{background:'#202333'}}>
              <td style={{padding:'8px 10px'}}>{row.date}</td>
              <td style={{padding:'8px 10px'}}>{Number(row.userCross).toLocaleString()}</td>
              <td style={{padding:'8px 10px'}}>{Number(row.userAdd).toLocaleString()}</td>
              <td style={{padding:'8px 10px'}}>{Number(row.exchange).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Fee schedule details (tiered) */}
      <div style={{marginTop:18,color:'#93d4c9'}}>
        <b>Current Fee Rates:</b> Maker: <b>{pnlResult.userFees.userAddRate}</b>, Taker: <b>{pnlResult.userFees.userCrossRate}</b>
        <br/>
        <b>Referral Discount:</b> {pnlResult.userFees.activeReferralDiscount}, <b>Staking Discount:</b> {pnlResult.userFees.activeStakingDiscount ? pnlResult.userFees.activeStakingDiscount.discount : 0}
      </div>
    </Card>
  )}
      {pnlResult && Array.isArray(pnlResult.fills) && pnlResult.fills.length > 0 && (
        <Card style={{maxWidth: 840, minWidth: 540, width: '100%', padding: '33px 23px', background:'#14212e'}}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:11,color:'#b4e1ff'}}>Recent Trade Fills (last 10)</div>
          <table style={{width:'100%',color:'#e6f9ff',fontSize:13,borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#312d45',fontWeight:800}}>
              <th style={{padding:'7px 8px'}}>Time</th>
              <th style={{padding:'7px 8px'}}>Coin</th>
              <th style={{padding:'7px 8px'}}>Start Pos</th>
              <th style={{padding:'7px 8px'}}>Size</th>
              <th style={{padding:'7px 8px'}}>Direction</th>
              <th style={{padding:'7px 8px'}}>Price</th>
              <th style={{padding:'7px 8px'}}>Closed PnL</th>
              <th style={{padding:'7px 8px'}}>Fee</th>
            </tr></thead>
            <tbody>
              {pnlResult.fills.slice(-10).map((f,i)=>(
                <tr key={f.time+f.coin+i} style={{background:i%2?'#1d2835':'none'}}>
                  <td style={{padding:'7px 8px'}}>{new Date(f.time).toLocaleString()}</td>
                  <td style={{padding:'7px 8px'}}>{f.coin}</td>
                  <td style={{padding:'7px 8px'}}>{f.startPosition}</td>
                  <td style={{padding:'7px 8px'}}>{f.sz}</td>
                  <td style={{padding:'7px 8px'}}>{f.side|| (f.sz>0?'Buy':'Sell')}</td>
                  <td style={{padding:'7px 8px'}}>{f.price}</td>
                  <td style={{padding:'7px 8px'}}>{f.closedPnl}</td>
                  <td style={{padding:'7px 8px'}}>{f.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      </div>
    </div>
  );
}
