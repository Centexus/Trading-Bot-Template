const binance = require("../client.js");

const balanceGiver = async () => {
  try {
    const balance = await binance.futures.balance();
    return balance.USDT;
  } catch (err) {
    console.error(err);
  }
};

module.exports = balanceGiver;
