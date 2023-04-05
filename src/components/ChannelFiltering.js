import React from "react";
import axios from "axios";
import Select from "react-select-virtualized";
import config from "react-global-configuration";

// CHANNEL FILTERING:
// Dynamically populate channel dropdown with active channels
//------------------------------------------------------------
class ChannelFiltering extends React.Component {
  state = {
    channels: [],
  };

  componentDidMount() {
    axios.get(config.get("api_url") + "channels/load-for-dropdown").then((res) => {
      const channels = res.data.channels;
      this.setState({ channels: channels });
    });
  }

  render() {
    return (
      <Select
        value={this.state.channels.filter((option) => option.value === this.props.activeChannel)}
        options={this.state.channels}
        onChange={this.props.onChange}
      />
    );
  }
}

export default ChannelFiltering;
