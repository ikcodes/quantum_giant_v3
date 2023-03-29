import React from "react";
import ReactDOM from "react-dom";
import App from "./global/App";

import config from "react-global-configuration";
config.set({
  // api_url: "https://quantumgiants.com/api/",
  api_url: "http://localhost/api/",
});

ReactDOM.render(<App />, document.getElementById("root"));
