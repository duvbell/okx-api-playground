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
const query = '?chain=story&collectionAddress=0xe42ef0e22b5baacb9dcea3e7f58a82d8033f0aca&status=active&limit=1';
const body = ''; // GET has no body

const preHash = timestamp + method + requestPath + query + body;

// Sign the prehash with your secret key using HMAC-SHA256, then base64 encode
const signature = nodeCrypto
  .createHmac('sha256', secretKey)
  .update(preHash)
  .digest('base64');

console.log(signature);

axios({
  method: method,
  url: `https://web3.okx.com${requestPath}${query}`,
  headers: {
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
  }
})
.then((response: any) => {
  console.log(response.data.data.data);
  
})
.catch((error: any) => {
  console.error('Error:', error.response?.data || error.message);
});