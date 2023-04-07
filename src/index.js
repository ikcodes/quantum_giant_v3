import React from "react";
import ReactDOM from "react-dom";
import App from "./global/App";
import config from "react-global-configuration";
require("dotenv").config();

// Socket woes?
// ln -s /Applications/MAMP/tmp/mysql/mysql.sock /tmp/mysql.sock

config.set({
  api_url:
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_PROD_API_URL
      : process.env.REACT_APP_API_URL,
});

ReactDOM.render(<App />, document.getElementById("root"));
