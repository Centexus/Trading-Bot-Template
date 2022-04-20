# Trading-Bot-template

This is the template for a trading bot for Binance Futures, have support of websockets.

## Users should edit the indicator file in:

`/indicators/index.js`

The function in that file should return a object that has signal inside it

`return { content : 'BUY'}` or `return { content : 'SELL'}`,
The bot would place the orders based on the signals returned from the indicators.


You can able to access open, close, high and low prices of the market (LIVE) in websocket.

### The data is passed in the order:

`Indicator(open, high, low, close)`

You can use these values to calculate the indicator value and return signals which will be calculated in the bot and the orders will be placed accordingly
