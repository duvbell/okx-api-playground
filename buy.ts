import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OKX_API_KEY!;
const secretKey = process.env.OKX_SECRET_KEY!;
const passphrase = process.env.OKX_PASSPHRASE!;

function generateOkxVerifySign(
  url: string,
  fetchConfig: { method?: string, body?: string } = {},
  timestampForTest?: number,
  tokenForTest?: string
) {
  const method = (fetchConfig.method || 'GET').toUpperCase();
  const body = fetchConfig.body || '';
  const token = tokenForTest || crypto.randomUUID();

  function computeHmacKey(t: string) {
    const digest = crypto.createHash('sha256').update(t).digest();
    const hexStr = Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');

    const currentTs = timestampForTest || Date.now();
    const u = Math.floor(currentTs / 1000);
    const s = Math.floor(u / 600) % 32;
    const l = Math.floor(u / 3600) % 32;

    let keyStr = '';
    for (let f = 0; f < 32; f++) {
      const idx = (s + (l + f) * f) % 32;
      keyStr += hexStr[idx];
    }

    return { key: Buffer.from(keyStr, 'utf-8'), timestamp: currentTs };
  }

  function buildSigningString(): string {
    const baseUrl = url.split('?')[0];
    if (['POST', 'PUT'].includes(method)) {
      return (baseUrl + body).replace(/ /g, '');
    }
    return url.replace('?', '');
  }

  const keyData = computeHmacKey(token);
  const signingMsg = buildSigningString();
  console.log("sign msg", signingMsg);
  const hmac = crypto.createHmac('sha256', keyData.key)
    .update(signingMsg)
    .digest('base64');

  return {
    'ok-verify-token': token,
    'ok-timestamp': String(keyData.timestamp),
    'ok-verify-sign': hmac
  };
}

async function main() {
  const requestPath = '/api/v5/mktplace/nft/markets/buy';
  const msTimestamp = Date.now();
  const query = `?t=${msTimestamp}`;
  const url = `https://web3.okx.com${requestPath}${query}`;

  const bodyPayload = {
    chain: 8453,
    items: [{
      orderId: 7724978122,
      // nftId: "39572774691281610",
      takeCount: 1
    }],
    walletAddress: "0xed20be1edafc77800594f2996de7329a4d9c1b6a"
  };

  const bodyStr = JSON.stringify(bodyPayload);
  const timestamp = new Date(msTimestamp).toISOString(); // ISO8601 UTC
  const preHash = timestamp + 'POST' + requestPath + query + bodyStr;

  const signature = crypto.createHmac('sha256', secretKey)
    .update(preHash)
    .digest('base64');

  const verifyHeaders = generateOkxVerifySign(url, { method: 'POST', body: bodyStr }, msTimestamp);

  console.log('Generated verify headers:', verifyHeaders);

  try {

    console.log('🚀 Making request to:', url);
    console.log('📦 Request body:', bodyStr);
    console.log('�� Headers:', {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
      ...verifyHeaders
    });

    
    const res = await axios({
      method: 'POST',
      url,
      data: bodyStr,
      headers: {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        'Content-Type': 'application/json',
        ...verifyHeaders
      }
    });

    console.log('✅ SUCCESS:', res.data);
  } catch (error: any) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

main();