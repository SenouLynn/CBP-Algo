const express = require("express");
const app = express();
const path = require("path");
const staticDir = path.resolve("./client/public");
require("dotenv").config();

//Server Port
const port = process.env.PORT || 5000;

//Middleware
//Middleware
app.use(express.urlencoded({ extended: false }));

//Coinbase Dependencies (Public API for use in Sandbox)
const CoinbasePro = require("coinbase-pro");
const publicClient = new CoinbasePro.PublicClient();

//Coinbase URI
//<----- ONLY USE SANDBOX UNLESS YOU'RE READY TO LOSE SOME FUCKING MONEY ----->//
// const apiURI = 'https://api.pro.coinbase.com';
const sandboxURI = "https://api-public.sandbox.pro.coinbase.com";

//Coinbase Secret API Variables (Sandbox)
const sandboxAPI = process.env.CBP_API_KEY;
const sandboxAPISecret = process.env.CBP_SECRET_KEY;
const sandboxPassphrase = process.env.CBP_PASSPHRASE;

//Coinbase WebSocket
const websocket = new CoinbasePro.WebsocketClient(
  ["BTC-USD"],
  "wss://ws-feed-public.sandbox.pro.coinbase.com",
  {
    key: sandboxAPI,
    secret: sandboxAPISecret,
    passphrase: sandboxPassphrase,
  },
  { channels: ["ticker", "level2"] }
);

app.get("/ticker", async (req, res) => {
  let btcPrice;
  if (websocket) {
    await websocket.on("message", async (data) => {
      //Ongoing price data => TICKER PRICE

      if(data.type = "ticker" && data.price !== undefined){
       btcPrice = data.price
      }
      
      
      console.log(btcPrice);
    });
    
    res.send(btcPrice);
  }
  //Websocket methods

  websocket.on("error", (err) => {
    console.error(err);
  });
  websocket.on("close", () => {
    /* ... */
  });
});

//Messing Around with bringing data in//
//<----- Get List of CBP Products ----->//
//List available pairs for trading => ex: BTC to USD (or vica versa)
app.get("/get-products", (req, res) => {
  console.log("Getting products");
  publicClient.getProducts((error, response, data) => {
    if (error) {
      res.send("Error : ", error);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

//Getting historic Rates for any time period (essentially what a candle is comprised of)
//Minimum of 300 data points
//Granularity times only accepted are: 60 for 1 minute, 300 for 5 minutes, 900 for 15 minutes, 3600 for 1 hour, 21600 for 6 hours, 86400 1 day}

app.get("/get-btc-ticker", (req, res) => {
  console.log("Getting BTC Ticker");
  publicClient.getProductHistoricRates(
    "BTC-USD",
    //granularity indicates time frame
    { granularity: 3600 },
    (status, data) => {
      let tickerPrice = JSON.parse(data.body);
      let dataBody;
      tickerPrice.forEach((item) => {
        dataBody = {
          time: item[0],
          low: item[1],
          high: item[2],
          open: item[3],
          close: item[4],
          volume: item[5],
        };
      });
      res.send(tickerPrice);
    }
  );
});

//24hour Stats
app.get("/stats", (req, res) => {
  console.log("Getting 24hr Stats");

  publicClient.getProduct24HrStats("BTC-USD", (status, data) => {
    let dayData = data.body;
    res.send(dayData);
  });
});


//TESTING PROXY//
app.get('/test', (req, res) => {
  res.send("proxy is working")
})

//Home Page
app.get("/", (req, res) => {
  res.send("Crypto Bot Let's GO");
});

// Catchall to send back to index.html
app.get("*", (req, res) => {
  res.sendFile(staticDir + "/index.html");
});




//Listening
app.listen(port, () => {
  console.log("Listening on PORT: ", port);
});
