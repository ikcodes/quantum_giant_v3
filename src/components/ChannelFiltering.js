import React from "react";
import axios from "axios";
import Select from "react-select-virtualized";
import config from "react-global-configuration";

class ChannelFiltering extends React.Component {
  // constructor(props){
  // super(props)
  state = {
    channels: [],
    // activeChannel: this.props.activeChannel
  };
  // }

  componentDidMount() {
    axios.get(config.get("api_url") + "channels/load-for-dropdown").then((res) => {
      const channels = res.data.channels;
      this.setState({ channels: channels }, () => {
        console.log("Channel filtering from API:", this.state.channels);
      });
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
