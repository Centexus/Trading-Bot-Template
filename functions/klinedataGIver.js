const axios = require("axios");

const klineDataGiver = async (symbol, timeFrame) => {
  try {
    const closePrices = [];
    const highPrices = [];
    const lowPrices = [];

    const klineData = await axios.get(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeFrame}`
    );

    klineData.data.forEach((data) => {
      highPrices.push(Number(data[2]));
      lowPrices.push(Number(data[3]));
      closePrices.push(Number(data[4]));
    });
    return { closePrices, highPrices, lowPrices };
  } catch (err) {
    console.error(err);
  }
};

module.exports = klineDataGiver;
