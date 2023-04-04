import React from "react";
import axios from "axios";
import config from "react-global-configuration";
import { Button, Table } from "semantic-ui-react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import PageHeader from "../../components/PageHeader";
import AddButton from "../../components/AddButton";
import TableActionButton from "../../components/TableActionButton";

//=======================================
//					ARTIST: LIST VIEW
//=======================================
class ChannelList extends React.Component {
  constructor(props) {
    var today = new Date(),
      date =
        today.getFullYear() +
        "-" +
        ("0" + (today.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + today.getDate()).slice(-2);
    super(props);
    this.state = {
      channels: [],
      breadcrumbs_1: "",
      instructions: "",
      currentDate: date,
    };

    this.deleteChannel = this.deleteChannel.bind(this);
  }

  componentDidMount() {
    axios.get(config.get("api_url") + "channels/load").then((res) => {
      this.setState({
        channels: res.data.channels,
      });
    });
  }

  // NEW DELETE (with custom return confirm)
  deleteChannel(channel_number, channel_name) {
    confirmAlert({
      title: "Deleting " + channel_name + "",
      message: "Really stop tracking " + channel_name + "?",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            const deleteUrl = config.get("api_url") + "channels/delete";
            const postData = {
              channel_number: channel_number,
            };
            axios.post(deleteUrl, postData).then((res) => {
              if (res.data.success >= 1) {
                window.location.reload();
              } else {
                alert(
                  "There was a problem deleting the channel. Please refresh the page and try again."
                );
              }
            });
          },
        },
        {
          label: "No",
          onClick: () => alert("Glad I asked ;)"),
        },
      ],
    });
  }

  render() {
    return (
      <div>
        <div className='grid-x grid-margin-x'>
          {/* PAGE HEADER + BREADCRUMBS */}
          <PageHeader
            h1='XM Channels'
            link='/channels'
            iconName='rss'
            breadcrumbs_1={this.state.breadcrumbs_1}
            breadcrumbs_2={this.state.breadcrumbs_2}
            instructions={this.state.instructions}
          />

          <div className='cell large-12' style={{ marginBottom: 15 }}>
            <p className='instructions'>
              Use this tool to <strong>modify which channels are tracked</strong> on SiriusXM.
            </p>
          </div>
        </div>

        {/* ADD ARTIST */}
        <AddButton link='/channels/edit/add' text='Track New Channel' />

        <div className='grid-x grid-margin-x'>
          {/* LIST OF ARTISTS */}
          <div className='cell large-8 table-scroll'>
            <Table celled striped unstackable>
              {/* TABLE HEADER & NAVIGATION */}
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell collapsing>Station</Table.HeaderCell>
                  <Table.HeaderCell>Channel Name</Table.HeaderCell>
                  <Table.HeaderCell collapsing>Broadcast</Table.HeaderCell>
                  <Table.HeaderCell collapsing style={{ textAlign: "left" }}>
                    Top Spinners
                  </Table.HeaderCell>
                  <Table.HeaderCell collapsing style={{ textAlign: "left" }}>
                    Recent Spins
                  </Table.HeaderCell>
                  <Table.HeaderCell collapsing style={{ textAlign: "left" }} colSpan={2}>
                    Actions
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              {/* TABLE BODY */}
              <Table.Body>
                {this.state.channels.map((channel) => {
                  const channelNumber = channel["channel_number"];
                  const channelHref = "/channels/edit/" + channelNumber;
                  const currSpinsHref =
                    "/spins?channel=" + channelNumber + "&start_date=" + this.state.currentDate;
                  const topSpinnersHref = "/top-spinners?channel=" + channelNumber + "&go=1";
                  const channelTypeText = channel["web"] === "1" ? "Web" : "XM"; // Int in DB, but string comes back
                  return (
                    <Table.Row key={channelNumber}>
                      <Table.Cell>{channel["channel_number"]}</Table.Cell>
                      <Table.Cell>{channel["channel_name"]}</Table.Cell>
                      <Table.Cell collapsing style={{ textAlign: "center" }}>
                        {channelTypeText}
                      </Table.Cell>
                      <Table.Cell collapsing style={{ textAlign: "center" }}>
                        <Button.Group basic size='small'>
                          <TableActionButton
                            link={topSpinnersHref}
                            actionName={"View Top Spinners on " + channel["channel_name"]}
                            actionIcon='sort amount down'
                          />
                        </Button.Group>
                      </Table.Cell>
                      <Table.Cell collapsing style={{ textAlign: "center" }}>
                        <Button.Group basic size='small'>
                          <TableActionButton
                            link={currSpinsHref}
                            actionName={"View Recent Spins on " + channel["channel_name"]}
                            actionIcon='list'
                          />
                        </Button.Group>
                      </Table.Cell>
                      <Table.Cell collapsing>
                        <Button.Group basic size='small'>
                          <TableActionButton
                            link={channelHref}
                            actionName='Edit Channel'
                            actionIcon='edit'
                          />
                          <TableActionButton
                            link={false}
                            actionName={"Delete Channel"}
                            actionIcon='trash'
                            onClick={() => {
                              this.deleteChannel(
                                channel["channel_number"],
                                channel["channel_name"]
                              );
                            }}
                          />
                        </Button.Group>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}

export default ChannelList;
