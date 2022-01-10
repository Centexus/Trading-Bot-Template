const axios = require("axios");

const klineDataGiver = async (symbol, timeFrame) => {
  try {
    const closePrices = [];
    const highPrices = [];
    const lowPrices = [];
    const openPrices = [];

    const klineData = await axios.get(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeFrame}`
    );

    klineData.data.forEach((data) => {
      openPrices.push(Number(data[1]));
      highPrices.push(Number(data[2]));
      lowPrices.push(Number(data[3]));
      closePrices.push(Number(data[4]));
    });
    return { openPrices, highPrices, lowPrices, closePrices };
  } catch (err) {
    console.error(err);
  }
};

module.exports = klineDataGiver;
