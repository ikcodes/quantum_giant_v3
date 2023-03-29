import React from "react";
import axios from "axios";
import queryString from "query-string";
import config from "react-global-configuration";
import PageHeader from "../components/PageHeader";
import TableBodyLoader from "../components/TableBodyLoader";
import ChannelFiltering from "../components/ChannelFiltering";
import DateFiltering from "../components/DateFiltering";
import TableActionButton from "../components/TableActionButton";
import { Button, Segment, Table, Icon, Label, Radio, Input } from "semantic-ui-react";

import { CSVLink } from "react-csv";

class SpinSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      custom_range: false, // Switch between week (DEFAULT) and custom range
      custom_dates: {
        start: "",
        end: "",
      },

      loading: true,
      spinSummary: [],
      spinCount: null,
      channel: 0,
      weeks_back: 1,
      weeks_back_text: "Last Week",
      csvExport: [[]],
      csvFilename: "", // Not declared but it gets set
      exportButtonMarkup: "not set",
    };

    this.updateCustom = this.updateCustom.bind(this);
    this.updateChannel = this.updateChannel.bind(this);
    this.updateweeksBack = this.updateweeksBack.bind(this);
    this.convertWeekToText = this.convertWeekToText.bind(this);
    this.renderExportButton = this.renderExportButton.bind(this);
    this.activateCustomDates = this.activateCustomDates.bind(this);
    this.deactivateCustomDates = this.deactivateCustomDates.bind(this);

    // this.updateWeek = this.updateWeek.bind(this);
    // this.updateSpinSummary = this.updateSpinSummary.bind(this);
  }
  componentDidMount() {
    const init_qv = queryString.parse(this.props.location.search);
    if (init_qv.weeks_back || init_qv.channel) {
      // console.log(init_qv.weeks_back);
      this.setState(
        {
          // Start out with this state, but also let it be updated later.
          channel: parseInt(init_qv.channel) || this.state.channel,
          weeks_back:
            parseInt(init_qv.weeks_back) >= 0
              ? parseInt(init_qv.weeks_back)
              : this.state.weeks_back,
        },
        () => {
          this.updateSpinSummary();
          let wb_text = this.convertWeekToText(this.state.weeks_back);
          // console.log("This should be going now...");
          // console.log(wb_text);
          this.setState({
            weeks_back_text: wb_text,
          });
        }
      );
    } else {
      this.updateSpinSummary();
    }
  }

  activateCustomDates() {
    this.setState(
      {
        custom_range: true,
        weeks_back_text: "Custom",
        spinSummary: [], // Empty table
        csvExport: [[]],
        csvFilename: "",
      },
      () => {
        if (this.state.custom_dates.start.length) {
          this.updateCustom();
        }
      }
    );
  }

  deactivateCustomDates() {
    var weekText = this.convertWeekToText(this.state.weeks_back);
    console.log("Deactivating. Here is week text:");
    this.setState(
      {
        custom_range: false,
        weeks_back_text: weekText,
        spinSummary: [], // Empty table
        csvExport: [[]],
        csvFilename: "",
      },
      () => {
        this.setState((prevState) => {
          return {
            custom_dates: {
              start: "",
              end: "",
            },
          };
        });
        this.updateSpinSummary();
      }
    );
  }

  updateStartDate = (event, { name, value }) => {
    var custom_dates = { ...this.state.custom_dates };
    custom_dates.start = value;
    this.setState({ custom_dates });
  };

  updateEndDate = (event, { name, value }) => {
    var custom_dates = { ...this.state.custom_dates };
    custom_dates.end = value;
    this.setState({ custom_dates });
  };

  updateSpinSummary() {
    this.setState(
      {
        loading: true,
        spinSummary: [], // Empty table
        csvExport: [[]],
        csvFilename: "",
      },
      () => {
        // Get new summary

        this.renderExportButton();
        var postData = {
          weeks_back: this.state.weeks_back,
          channel: this.state.channel,
        };

        axios.post(config.get("api_url") + "spin-summary/summary", postData).then((res) => {
          if (res.data.summary) {
            // console.log('File will be named:');
            // console.log(res.data.csv_filename);
            this.setState(
              {
                spinCount: res.data.summary.spin_ct,
                spinSummary: res.data.summary.spins,
                csvExport: res.data.csv,
                csvFilename: res.data.csv_filename,
                loading: false,
              },
              () => {
                this.renderExportButton();
              }
            );
          } else {
            console.log("Could not get stuff!!!! No res.data.summary!");
            console.log(res.data);
          }
        });
      }
    );
  }

  updateCustom() {
    this.setState(
      {
        loading: true,
        spinSummary: [], // Empty table
        csvExport: [[]],
        csvFilename: "",
      },
      () => {
        // Get new summary

        this.renderExportButton();
        var postData = {
          start_date: this.state.custom_dates.start,
          end_date: this.state.custom_dates.end,
          channel: this.state.channel,
        };

        console.log(postData);

        axios.post(config.get("api_url") + "spin-summary/summary-custom", postData).then((res) => {
          if (res.data.summary) {
            this.setState(
              {
                spinCount: res.data.summary.spin_ct,
                spinSummary: res.data.summary.spins,
                csvExport: res.data.csv,
                csvFilename: res.data.csv_filename,
                loading: false,
              },
              () => {
                this.renderExportButton();
              }
            );
          } else {
            console.log("Could not get stuff!!!! No res.data.summary!");
            console.log(res.data);
          }
        });
      }
    );
  }

  updateChannel = (event, { name, value }) => {
    if (event) {
      const channelId = event.value;
      this.setState(
        {
          channel: channelId,
        },
        () => {
          if (this.state.custom_range === true) {
            this.updateCustom();
          } else {
            this.updateSpinSummary();
          }
        }
      );
    } else {
      this.setState(
        {
          channel: 0,
        },
        () => {
          if (this.state.custom_range === true) {
            this.updateCustom();
          } else {
            this.updateSpinSummary();
          }
        }
      );
    }
  };

  updateweeksBack(e) {
    const newWeek = parseInt(e.target.value);
    if (newWeek >= 0) {
      this.setState(
        {
          weeks_back: newWeek,
          weeks_back_text: this.convertWeekToText(newWeek),
        },
        () => this.updateSpinSummary()
      );
    }
  }

  convertWeekToText(weekInt) {
    return weekInt === 0 ? "This Week" : weekInt === 1 ? "Last Week" : weekInt + " Weeks Ago";
  }

  updateWeek = (e, { value }) => {
    let weekText;
    const selectedWeek = parseInt(value);
    if (selectedWeek === 0) {
      weekText = "This Week (To Date)";
    } else if (selectedWeek === 1) {
      weekText = "Last Week";
    } else if (selectedWeek === 2) {
      weekText = "Two Weeks Ago";
    } else if (selectedWeek === 3) {
      weekText = "Three Weeks Ago";
    }

    this.setState(
      {
        weeks_back: selectedWeek,
        weeks_back_text: weekText,
      },
      () => {
        this.updateSpinSummary(selectedWeek);
        // console.log("Value, then State"); console.log(value); console.log(this.state);
      }
    );
  };

  renderExportButton() {
    if (this.state.csvExport.length > 1) {
      // Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
      var mkp = (
        <CSVLink data={this.state.csvExport} filename={this.state.csvFilename}>
          <Button style={{ marginBottom: 30, width: "100%" }} primary>
            Export Spin Summary
          </Button>
        </CSVLink>
      );
      this.setState({
        exportButtonMarkup: mkp,
      });
    } else {
      this.setState({
        exportButtonMarkup: (
          <Button style={{ marginBottom: 15, width: "100%" }} primary disabled>
            Loading Spin Summary...
          </Button>
        ),
      });
    }
  }

  render() {
    let displayWeeksShown = this.state.custom_range ? { display: "none" } : { marginBottom: 15 };
    let displayCustomDates = this.state.custom_range ? { marginBottom: 15 } : { display: "none" };

    let spinCtStyle = {
      marginBottom: 0,
      width: "100%",
      padding: 13,
      textAlign: "center",
    };

    let spinCtMarkup = !this.state.loading ? (
      <Label size='large' style={spinCtStyle}>
        <Icon name='headphones' />
        Total Spins: <strong>{this.state.spinCount}</strong>
      </Label>
    ) : (
      <Label size='large' style={spinCtStyle}>
        <Icon name='headphones' />
        Loading Spin Data...
      </Label>
    );

    return (
      <Segment id='spinSummary' className='page'>
        <div className='grid-x grid-margin-x'>
          <PageHeader
            h1='Spin Summary'
            link='/spin-summary'
            iconName='headphones'
            instructions='All spins registered here are owned tracks.'
            breadcrumbs_1={this.state.weeks_back_text}
            // breadcrumbs_2={ this.state.weeks_back_text && this.state.channel === 105 ? "She's So Funny" : '' }
          />

          {/* CUSTOM DATE TOGGLE */}
          <div id='queryCustomDatesContainer'>
            <Radio
              toggle
              checked={this.state.custom_range === true}
              onChange={
                this.state.custom_range === true
                  ? this.deactivateCustomDates
                  : this.activateCustomDates
              }
              label='Custom Dates'
              style={{ marginBottom: 15 }}
            />
          </div>

          {/* CUSTOM DATE FILTERS */}
          <div style={displayCustomDates} className='cell medium-6'>
            <div className='ui form'>
              <div className='ui field'>
                <label style={{ minWidth: 100 }}>Start Date</label>
                <DateFiltering
                  placeholder='Starting on...'
                  onChange={this.updateStartDate}
                  value={this.state.custom_dates.start}
                />
              </div>
            </div>
          </div>
          <div style={displayCustomDates} className='cell medium-6'>
            <div className='ui form'>
              <div className='ui field'>
                <label style={{ minWidth: 100 }}>End Date</label>
                <DateFiltering
                  placeholder='Ending on...'
                  onChange={this.updateEndDate}
                  value={this.state.custom_dates.end}
                />
              </div>
            </div>
          </div>

          {/* WEEKS SHOWN */}
          <div className='cell medium-5 large-4' style={displayWeeksShown}>
            <Input
              style={{ marginBottom: 0 }}
              label='Weeks Ago: '
              fluid
              type='number'
              onChange={this.updateweeksBack}
              value={this.state.weeks_back}
            />
          </div>

          {/* CHANNEL FILTERING */}
          <div className='cell medium-6'>
            <div id='channelFilteringContainer'>
              <ChannelFiltering
                activeChannel={parseInt(this.state.channel)}
                onChange={this.updateChannel}
              />
            </div>
          </div>

          <div className='cell medium-6' style={displayCustomDates}>
            {/* <Button id='queryCustomDates' onClick={ this.updateCustom } primary>Query Custom Dates</Button> */}
            <Button style={{ width: "100%" }} onClick={this.updateCustom} primary>
              Query Custom Dates
            </Button>
          </div>

          {/* USER FILTERS */}
          <div className='cell medium-4 large-3' style={{ marginBottom: 15 }}>
            {spinCtMarkup}
          </div>
          <div className='cell medium-shrink'>{this.state.exportButtonMarkup}</div>
          <div className='cell auto'></div>
          <div className='cell small-12 table-scroll'>
            <Table celled compact striped unstackable>
              {/* TABLE HEADER & NAVIGATION */}
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Artist</Table.HeaderCell>
                  <Table.HeaderCell collapsing textAlign='center'>
                    Spin Count
                  </Table.HeaderCell>
                  <Table.HeaderCell collapsing textAlign='center'>
                    Spins
                  </Table.HeaderCell>
                  <Table.HeaderCell collapsing textAlign='center'>
                    Rights
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <TableBodyLoader
                  loading={this.state.loading}
                  cols={4}
                  message='Loading Spin Summary...'
                  slow={true}
                />

                {this.state.spinSummary.map((spin_count, index) => {
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>{spin_count.artist_name}</Table.Cell>
                      <Table.Cell textAlign='center'>
                        <strong>{spin_count.spin_ct}</strong>
                      </Table.Cell>
                      <Table.Cell textAlign='center'>
                        <Button.Group basic size='small'>
                          <TableActionButton
                            link={"/summary/artist?artist_id=" + spin_count["artist_id"]}
                            actionName={"Artist Summary for " + spin_count["artist_name"]}
                            actionIcon='chart pie'
                          />
                          <TableActionButton
                            link={"/spins?artist_id=" + spin_count["artist_id"]}
                            actionName={"800PGR Spins by " + spin_count["artist_name"]}
                            actionIcon='chart line'
                          />
                        </Button.Group>
                      </Table.Cell>
                      <Table.Cell textAlign='center'>
                        <Button.Group basic size='small'>
                          <TableActionButton
                            link={"/tracks/artist/" + spin_count["artist_id"]}
                            actionName={"Tracks by " + spin_count["artist_name"]}
                            actionIcon='list'
                          />
                          <TableActionButton
                            link={"/albums/artist/" + spin_count["artist_id"]}
                            actionName={"Albums by " + spin_count["artist_name"]}
                            actionIcon='clone'
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
      </Segment>
    );
  }
}

export default SpinSummary;
