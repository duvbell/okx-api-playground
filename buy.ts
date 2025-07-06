const axios = require('axios');
const nodeCrypto = require('crypto');
require('dotenv').config();

// Replace these with your real values from OKX API portal
const apiKey = process.env.OKX_API_KEY;
const secretKey = process.env.OKX_SECRET_KEY;
const passphrase = process.env.OKX_PASSPHRASE;

const timestamp = new Date().toISOString(); // OKX requires ISO8601 format
const method = 'POST';
const requestPath = '/priapi/v1/nft/trading/buy';
const query = `?t=${Date.now()}`;
const body = JSON.stringify({
  chain: 1514,
  items: [{
    orderId: 7708992897, // Replace with your actual order ID
    nftId: "39569752686861002", // Replace with your actual NFT ID
    takeCount: 1
  }],
  walletAddress: "0x3f98e41fd95ddb428d5c1d6b8f3838901e788b22" // Replace with your wallet address
});

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
  data: body, // Add this line
  headers: {
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-VERIFY-SIGN': "Qax63JacIPKUmlsTkk0rKWsFNxSVfc0VFJfbHrS9uEI=",
    'OK-VERIFY-TOKEN': 'd07f1909-51ef-458a-b853-5b89d3c8718d',
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
    'content-type': 'application/json', // Add this header
  }
})
.then((response: any) => {
  console.log(response.data.data.data);
  
})
.catch((error: any) => {
  console.error('Error:', error.response?.data || error.message);
});