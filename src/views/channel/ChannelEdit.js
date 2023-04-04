import React from "react";
import axios from "axios";
import config from "react-global-configuration";
import { Link, Redirect } from "react-router-dom";
import { Radio, Input, Form, Table } from "semantic-ui-react";
import PageHeader from "../../components/PageHeader";

//=======================================
//					ARTIST: EDIT VIEW
//=======================================
class ChannelEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      add: props.add,
      toListView: false, // Only true when we want to redirect to list view.
      channelNumber: props.channelNumber,

      // DB record
      channel: {
        channel_number: "",
        channel_name: "",
        channel_key: "",
        web: 0,
      },

      nowPlaying: {
        title: "",
        album: "",
        artist: "",
      },

      success: false,

      instructions: props.add ? "Now adding new channel." : "Now editing the channels.", // POST OR SESSION? BOTH?
      breadcrumbs_1: props.add ? "New Channel" : "", // API reponds
      breadcrumbs_2: props.add ? "Add" : "Edit",
    };

    this.addChannel = this.addChannel.bind(this);
    this.testChannel = this.testChannel.bind(this);
    this.saveChannel = this.saveChannel.bind(this);
    this.updateWebChannel = this.updateWebChannel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateChannelNumber = this.updateChannelNumber.bind(this);
  }

  componentDidMount() {
    // Get current channel (channel_number passed from ChannelPage)
    const postData = {
      channel_number: this.state.channelNumber,
    };
    if (this.state.add) {
      this.setState({
        instructions: "Adding new channel.",
      });
    } else {
      axios.post(config.get("api_url") + "channels/edit-channel", postData).then((res) => {
        if (res.data.channel) {
          this.setState(
            {
              channel: res.data.channel,

              // CASE: Number changes (sat => web), endpoint tries to load old one
              number_changed: false,
              old_number: parseInt(res.data.channel.channel_number),

              breadcrumbs_1: res.data.channel["channel_name"],
              instructions:
                "Now editing channel metadata for " + res.data.channel["channel_name"] + ".",
            },
            () => {
              this.testChannel(); // TEST ONLOAD : This shows a 'now playing' block, which (WILL BE) REQUIRED for SAVE
            }
          );
        }
      });
    }
  }

  addChannel() {
    this.setState({
      channel: {},
      breadcrumbs_1: "New Channel",
      instructions: "Now adding new channel! Hooray!",
      showSpellingClass: false,
    });
  }

  testChannel() {
    var channelKey = this.state.channel.channel_key;
    axios
      .post(config.get("api_url") + "channels/test-channel", { channelKey: channelKey })
      .then((res) => {
        if (res.data.success) {
          var channel_changed =
            parseInt(res.data.channelNumber) !== parseInt(this.state.channel.channel_number);
          var newChanData = {
            channel_number: res.data.channelNumber,
            channel_name: res.data.channelName,
            channel_key: res.data.channelKey,
            web: this.state.channel.web,
          };
          var nowPlaying = {
            artist: res.data.nowPlaying.artist,
            album: res.data.nowPlaying.album,
            title: res.data.nowPlaying.title,
          };
          this.setState({
            success: true,
            channel: newChanData,
            nowPlaying: nowPlaying,
            number_changed: channel_changed,
          });
        } else {
          this.setState({
            // FAIL! Set state back to init
            success: false,
            channel: {
              channel_number: "",
              channel_name: "",
              channel_key: "",
              web: 0,
            },
            number_changed: true,

            nowPlaying: {
              title: "",
              album: "",
              artist: "",
            },
          });
          alert("Try Again! This channel was not found.");
          console.log(this.state);
        }
      });
  }

  saveChannel() {
    if (this.state.channel["channel_name"]) {
      const saveData = {
        add: this.state.add,
        web: this.state.channel["web"],
        channel_key: this.state.channel["channel_key"],
        channel_name: this.state.channel["channel_name"],
        channel_number: this.state.channel["channel_number"],

        // Did we change numbers, on re-check?
        number_changed: this.state.number_changed,
        old_number: this.state.old_number,
      };
      axios.post(config.get("api_url") + "channels/update-channel", saveData).then(() => {
        this.setState({
          toListView: true,
        });
      });
    } else {
      // No name. Bail out.
      this.setState({
        channel: {
          channel_key: "",
        },
        breadcrumbs_1: "",
        instructions: "Could not add channel. Please refresh and try again.",
      });
    }
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    const currChannel = this.state.channel;
    currChannel[name] = value;

    this.setState({
      channel: currChannel, // New object with updated property.
    });
  }

  updateChannelNumber(e) {
    const channelNumber = parseInt(e.target.value);
    if (channelNumber >= 0) {
      var tempChan = this.state.channel;
      tempChan["channel_number"] = channelNumber;
      this.setState({
        channel: tempChan,
      });
    }
  }

  updateWebChannel(e, { value }) {
    var tempChan = this.state.channel;
    tempChan["web"] = parseInt(value);
    this.setState({
      channel: tempChan,
    });
  }

  render() {
    if (this.state.toListView === true) {
      return <Redirect to={this.state.toListViewUrl || "/channels"} />;
    }

    return (
      <div className='grid-x grid-margin-x'>
        {/* PAGE HEADER + BREADCRUMBS */}
        <PageHeader
          h1='Channels'
          link='/channels'
          iconName='user'
          breadcrumbs_1={this.state.breadcrumbs_1}
          breadcrumbs_2={this.state.breadcrumbs_2}
          // This was commented out...
          instructions={this.state.instructions}
        />

        {/*==============*/}
        {/* CHANNEL FORM */}
        {/*==============*/}
        <div className='cell small-12' style={{ paddingBottom: 20 }}>
          <h4 style={{ marginBottom: 5 }}>HOW TO USE THIS TOOL:</h4>
          <p className='smalltext'>
            Tracking a channel requires you to <strong>'guess' a Channel Key</strong>, using the
            Channel Name.
            <br className='show-for-medium' />
            Remove spaces and test different capitalization patterns. Use the other channels as
            guides. <br className='show-for-medium' />
            Click <strong>Test Channel</strong>. If you guess correctly, the 'Now Playing' table
            will fill in. Lastly, <strong>save the channel</strong>.
          </p>
        </div>

        <div className='cell large-6 medium-12'>
          <Form autoComplete='off'>
            <div className='grid-x grid-margin-x' style={{ paddingBottom: 20 }}>
              <div className='cell'>
                <Form.Input
                  onChange={this.handleInputChange}
                  name='channel_key'
                  label='Channel Key'
                  value={this.state.channel["channel_key"] || ""}
                />

                <Form.Input
                  onChange={this.handleInputChange}
                  name='channel_name'
                  label='Channel Name'
                  value={this.state.channel["channel_name"] || ""}
                />
              </div>
            </div>
            <div className='grid-x grid-margin-x'>
              <div className='cell'>
                <Input
                  style={{ marginBottom: 15 }}
                  label='Channel Number: '
                  fluid
                  type='number'
                  onChange={this.updateChannelNumber}
                  value={this.state.channel.channel_number}
                />
              </div>
              <div className='cell'>
                <div style={{ marginBottom: 15 }} className='ui fluid labeled input'>
                  <div className='ui label label'>Web Only? </div>
                  <Radio
                    label='No'
                    name='web'
                    value={0}
                    checked={this.state.channel.web === 0}
                    onChange={this.updateWebChannel}
                    style={{ paddingTop: 12, paddingLeft: 30 }}
                  />
                  <Radio
                    label='Yes'
                    name='web'
                    value={1}
                    checked={this.state.channel.web === 1}
                    onChange={this.updateWebChannel}
                    style={{ paddingTop: 12, paddingLeft: 30 }}
                  />
                </div>
              </div>
            </div>
            <Form.Group>
              <Form.Button onClick={(e) => this.testChannel()} secondary>
                Test Channel
              </Form.Button>
              <Form.Button onClick={(e) => this.saveChannel()} primary>
                Save Channel
              </Form.Button>
              <Link to={"/channels"}>
                <Form.Button primary style={{ marginRight: "12px" }}>
                  Back to Channels
                </Form.Button>
              </Link>
            </Form.Group>
          </Form>
        </div>

        {/*===============*/}
        {/* RESULTS TABLE */}
        {/*===============*/}
        <div className='cell large-4' style={{ paddingTop: 25 }}>
          <Table celled striped unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell colSpan={2}>Now Playing:</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell collapsing>Title:</Table.Cell>
                <Table.Cell>{this.state.nowPlaying.title}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell collapsing>Artist:</Table.Cell>
                <Table.Cell>{this.state.nowPlaying.artist}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell collapsing>Album:</Table.Cell>
                <Table.Cell>{this.state.nowPlaying.album}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>
      </div>
    );
  }
}

export default ChannelEdit;
