require("dotenv").config();
const { Telegraf } = require("telegraf");
const balanceGiver = require("./functions/balance.js");
const binance = require("./client.js");
const Websocket = require("ws");
const klineDataGiver = require("./functions/klinedataGIver.js");
const SuperTrendIndicator = require("./indicators/supertrend.js");

const bot = new Telegraf(process.env.TELEGRAM_API_KEY);

// globals
let coinName = "";
let timeFrame = "";
let amount = "";
let leverage = 0;

bot.start((ctx) => {
  ctx.reply(
    "Welcome!\nI am Baby Aglypto\nI can trade Cryptos automatically using Super Trend\nReady to make Stonks! 🤑"
  );
});

bot.command("balance", async (ctx) => {
  try {
    ctx.reply("Retreiving...");

    const balance = await balanceGiver();
    ctx.reply(
      `Balance Details (USDT)\nAvailable: $${balance.available}\nTotal: $${balance.total}`
    );
  } catch (err) {
    console.error(err);
  }
});

bot.command("openposition", async (ctx) => {
  try {
    ctx.reply("Retreiving....");
    const msgText = ctx.message.text.split(" ");
    coinName = msgText[1].toLowerCase() + "usdt";
    timeFrame = msgText[2].toLowerCase();
    amount = Number(msgText[3]);
    leverage = Number(msgText[4]);
    ctx.reply(
      `Symbol : ${coinName.toUpperCase()}\nTimeFrame : ${timeFrame}\nIf you wish to change the timeframe type /changetime\nIf you wish to change the coin name type /changecoin\n or type /confirm to confirm the order`
    );
  } catch (err) {
    console.error(err);
  }
});

bot.command("/changetime", async (ctx) => {
  timeFrame = ctx.message.text.split(" ")[1].toLowerCase();
  ctx.reply(
    `Symbol : ${coinName.toUpperCase()}\nTimeFrame : ${timeFrame}\nIf you wish to change the timeframe type /changetime\nIf you wish to change the coin name type /changecoin\n or type /confirm to confirm the order`
  );
});

bot.command("/changecoin", async (ctx) => {
  coinName = ctx.message.text.split(" ")[1].toLowerCase() + "usdt";
  ctx.reply(
    `Symbol : ${coinName.toUpperCase()}\nTimeFrame : ${timeFrame}\nIf you wish to change the timeframe type /changetime\nIf you wish to change the coin name type /changecoin\n or type /confirm to confirm the order`
  );
});

bot.command("confirm", async (ctx) => {
  let signal = "";
  let orderOpenend = false;
  let quantity = 0;
  let initSignal = "";
  const exobj = await binance.futures.exchangeInfo();
  const symbols = await exobj["symbols"];
  const assetObj = await symbols.filter((obj) => {
    return obj.symbol === coinName.toUpperCase();
  });
  try {
    let { closePrices, highPrices, lowPrices } = await klineDataGiver(
      coinName,
      timeFrame
    );
    quantity = (
      (leverage * amount) /
      closePrices[closePrices.length - 1]
    ).toFixed(assetObj[0].quantityPrecision);
    setInterval(async () => {
      let data = await klineDataGiver(coinName, timeFrame);
      closePrices = await data.closePrices;
      highPrices = await data.highPrices;
      lowPrices = await data.lowPrices;
    }, 62000);
    const ws = new Websocket(
      `wss://fstream.binance.com/ws/${coinName}_perpetual@continuousKline_${timeFrame}`
    );
    console.log("running....");
    ws.onmessage = async (data) => {
      try {
        closePrices.pop();
        closePrices.push(Number(JSON.parse(data.data).k.c));
        highPrices.pop();
        highPrices.push(Number(JSON.parse(data.data).k.h));
        lowPrices.pop();
        lowPrices.push(Number(JSON.parse(data.data).k.l));
        signal = SuperTrendIndicator(
          closePrices,
          highPrices,
          lowPrices
        ).content;
        if (!orderOpenend) {
          if (signal === "BUY") {
            initSignal = "BUY";
            await binance.futures.marketBuy(coinName, quantity);
            console.log("order placed");
            orderOpenend = true;
          } else if (signal === "SELL") {
            initSignal = "SELL";
            await binance.futures.marketSell(coinName, quantity);
            console.log("order placed");
            orderOpenend = true;
          }
        } else if (orderOpenend) {
          const positions = await binance.futures.positionRisk();
          const coin = positions.filter((position) => {
            return position.symbol === coinName.toUpperCase();
          });
          if (Number(coin[0].positionAmt) === 0) {
            ws.close();
            console.log("Order Closed waiting for another order to open...");
          } else {
            console.log(signal, initSignal, "checking for change");

            if (signal === "BUY" && initSignal === "SELL") {
              initSignal = "BUY";
              await binance.futures.marketBuy(coinName, quantity * 2);
            } else if (signal === "SELL" && initSignal === "BUY") {
              initSignal = "SELL";
              await binance.futures.marketSell(coinName, quantity * 2);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
  } catch (err) {
    console.error(err);
  }
});

bot.help(async (ctx) => {
  try {
    ctx.reply("Retreiving Commands List...");
    const commands = await bot.telegram.getMyCommands();
    let helpText = "";
    commands.forEach((command) => {
      helpText += `Command : /${command.command}\nDescription: ${command.description}\n\n`;
    });
    ctx.reply(helpText);
  } catch (err) {
    console.error(err);
  }
});

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

bot.launch();

// Enable graceful Stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
