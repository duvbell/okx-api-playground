import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OKX_API_KEY!;
const secretKey = process.env.OKX_SECRET_KEY!;
const passphrase = process.env.OKX_PASSPHRASE!;

function generateOkxVerifySign(
  url: string,
  fetchConfig: { method?: string; body?: string } = {},
  timestampForTest?: number,
  tokenForTest?: string
) {
  const method = (fetchConfig.method || 'GET').toUpperCase();
  const body = fetchConfig.body || '';
  const token = tokenForTest || crypto.randomUUID();

  function computeHmacKey(t: string) {
    const digest = crypto.createHash('sha256').update(t).digest();
    const hexStr = Array.from(digest).map((b) =>
      b.toString(16).padStart(2, '0')
    ).join('');

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
    const basePath = new URL(url).pathname;
    if (['POST', 'PUT'].includes(method)) {
      return (basePath + body).replace(/ /g, '');
    }
    return basePath + (url.includes('?') ? url.split('?')[1] : '');
  }

  const keyData = computeHmacKey(token);
  const signingMsg = buildSigningString();
  console.log('🔐 Signing msg:', signingMsg);
  const hmac = crypto.createHmac('sha256', keyData.key)
    .update(signingMsg)
    .digest('base64');

  return {
    'ok-verify-token': token,
    'ok-timestamp': String(keyData.timestamp),
    'ok-verify-sign': hmac,
  };
}

async function main() {
  const requestPath = '/priapi/v1/nft/trading/buy';
  const msTimestamp = Date.now();
  const query = `?t=${msTimestamp}`;
  const url = `https://web3.okx.com${requestPath}${query}`;

  const bodyPayload = {
    chain: 1514,
    items: [
      {
        orderId: 7708992897,
        takeCount: 1,
      },
    ],
    walletAddress: '0x53A152Fc28d010af50442C31117D86575847594c',
  };

  const bodyStr = JSON.stringify(bodyPayload);
  const timestamp = new Date(msTimestamp).toISOString();
  const preHash = timestamp + 'POST' + requestPath + query + bodyStr;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(preHash)
    .digest('base64');

  const verifyHeaders = generateOkxVerifySign(
    url,
    { method: 'POST', body: bodyStr },
    msTimestamp
  );

  const headers = {
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
    'Content-Type': 'application/json',
    ...verifyHeaders,
  };

  console.log('🧾 Headers:', headers);

  try {
    const res = await axios({
      method: 'POST',
      url,
      data: bodyStr,
      headers,
    });

    console.log('✅ SUCCESS:', res.data.data.steps[0].items);
  } catch (error: any) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

main();