// client to initiate the binance client

require("dotenv").config();
const Binance = require("node-binance-api-ext");

const binance = Binance({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
});

module.exports = binance;
