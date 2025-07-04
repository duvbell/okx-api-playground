const axios = require('axios');
const nodeCrypto = require('crypto');
require('dotenv').config();

// Replace these with your real values from OKX API portal
const apiKey = process.env.OKX_API_KEY;
const secretKey = process.env.OKX_SECRET_KEY;
const passphrase = process.env.OKX_PASSPHRASE;

const timestamp = new Date().toISOString(); // OKX requires ISO8601 format
const method = 'GET';
const requestPath = '/api/v5/mktplace/nft/markets/listings';
const query = '?chain=story&collectionAddress=0x7df2de0e06ea570fc315aa738957c0c7a954cebf&status=active&limit=50';
const body = ''; // GET has no body

const preHash = timestamp + method + requestPath + query + body;

// Sign the prehash with your secret key using HMAC-SHA256, then base64 encode
const signature = nodeCrypto
  .createHmac('sha256', secretKey)
  .update(preHash)
  .digest('base64');

axios({
  method: method,
  url: `https://www.okx.com${requestPath}${query}`,
  headers: {
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
  }
})
.then((response: any) => {
  console.log('Success:', response.data);
})
.catch((error: any) => {
  console.error('Error:', error.response?.data || error.message);
});