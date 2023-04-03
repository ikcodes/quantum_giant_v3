import React from "react";
import ReactDOM from "react-dom";
import App from "./global/App";

// Socket woes?
// ln -s /Applications/MAMP/tmp/mysql/mysql.sock /tmp/mysql.sock

import config from "react-global-configuration";
config.set({
  // api_url: "https://quantumgiants.com/api/",
  api_url: "http://localhost:8888/api/",
});

ReactDOM.render(<App />, document.getElementById("root"));
