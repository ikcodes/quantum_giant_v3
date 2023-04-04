// Packages
import React from "react";
import axios from "axios";
import queryString from "query-string";
import config from "react-global-configuration";

// Components
import PageHeader from "../components/PageHeader";
import TableBodyLoader from "../components/TableBodyLoader";
import ChannelFiltering from "../components/ChannelFiltering";

// Chart stuff
import {
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

// Semantic Elements
import { Button, Input, Segment, Table } from "semantic-ui-react";
import { CSVLink } from "react-csv";

//===================================================

class TrackSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      track_gid: 0,
      track_title: "",
      channel: 0, // 0 = all
      weeks_shown: 4,
      weeks_shown_text: "Use the filters below to view detailed Spin-formation on this Track.",
      summary: {
        spins: [],
        chartData: [],
      },
      csvExport: [[]],
    };
    this.updateChannel = this.updateChannel.bind(this);
    this.queryForSummary = this.queryForSummary.bind(this);
    this.updateWeeksShown = this.updateWeeksShown.bind(this);
    this.renderExportButton = this.renderExportButton.bind(this);
    this.convertWeeksToText = this.convertWeeksToText.bind(this);
  }

  componentDidMount() {
    const init_qv = queryString.parse(this.props.location.search);
    if (init_qv.weeks || init_qv.channel) {
      this.setState(
        {
          // Start out with this state, but also let it be updated later.
          channel: parseInt(init_qv.channel) || this.state.channel,
          weeks_shown: parseInt(init_qv.weeks) || this.state.weeks_shown,
        },
        () => {
          this.queryForSummary();
        }
      );
    } else {
      this.queryForSummary();
    }
  }

  queryForSummary() {
    let queryValues = queryString.parse(this.props.location.search);
    if (queryValues.track_gid) {
      this.setState(
        {
          track_gid: parseInt(queryValues.track_gid),
          csvExport: [],
        },
        () => {
          this.renderExportButton(); // BLANK IT OUT, & REPLACE WITH NEW $#!+
          var postData = {
            gid: this.state.track_gid,
          };
          axios.post(config.get("api_url") + "tracks/track-title-by-gid", postData).then((res) => {
            if (res.data.title) {
              this.setState(
                {
                  track_title: res.data.title,

                  // HO BOY
                  artist_id: res.data.artist_id,
                  artist_name: res.data.artist_name,
                  breadcrumbs_1: res.data.artist_name,
                  breadcrumbs_1_url: "/albums/artist/" + res.data.artist_id,
                  breadcrumbs_2: res.data.album_title,
                  breadcrumbs_2_url: "/tracks/album/" + res.data.album_id,
                },
                () => {
                  const summaryPost = {
                    track_gid: this.state.track_gid,
                    weeks_shown: this.state.weeks_shown,
                    channel: this.state.channel,
                  };
                  axios.post(config.get("api_url") + "summary/track", summaryPost).then((res) => {
                    let newWeekText =
                      "Now viewing all spins in the " +
                      this.convertWeeksToText(this.state.weeks_shown) +
                      ".";
                    if (res.data) {
                      this.setState(
                        {
                          summary: res.data,
                          loading: false,
                          csvExport: res.data.csv,
                          weeks_shown_text: newWeekText,
                        },
                        () => {
                          this.renderExportButton();
                        }
                      );
                    } else {
                      this.setState({
                        loading: false,
                        error: true,
                      });
                    }
                  });
                }
              );
            }
          });
        }
      );
    } else {
      console.log("We need an GID to not screw this up!");
    }
  }

  updateChannel = (event, { name, value }) => {
    if (event) {
      const channelId = event.value;
      this.setState(
        {
          channel: channelId,
        },
        () => this.queryForSummary()
      );
    } else {
      this.setState(
        {
          channel: 0,
        },
        () => this.queryForSummary()
      );
    }
  };

  updateWeeksShown(e) {
    const newWeeks = parseInt(e.target.value);
    if (newWeeks >= 0 && newWeeks <= 26) {
      // Enforce this range
      this.setState(
        {
          weeks_shown: newWeeks,
          weeks_shown_text:
            "Now viewing all spins in the " + this.convertWeeksToText(newWeeks) + ".",
        },
        () => this.queryForSummary()
      );
    }
  }

  convertWeeksToText(weekInt) {
    return weekInt === 0 ? "This Week" : weekInt === 1 ? "Last Week" : "Last " + weekInt + " weeks";
  }

  renderExportButton() {
    if (this.state.csvExport.length > 1) {
      // Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
      return (
        <CSVLink data={this.state.csvExport}>
          <Button style={{ marginBottom: 30, width: "100%" }} primary>
            Export Track Summary
          </Button>
        </CSVLink>
      );
    } else {
      return (
        <Button style={{ marginBottom: 15, width: "100%" }} primary disabled>
          Export Track Summary
        </Button>
      );
    }
  }

  renderSpinChart() {
    if (this.state.summary.spins.length && !this.state.loading) {
      return (
        <ResponsiveContainer width='100%' height={360}>
          <AreaChart data={this.state.summary.chartData} height={360} width={730}>
            <defs>
              <linearGradient id='colorUv' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#2b2545' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#2b2545' stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <XAxis dataKey='Week' />
            <YAxis />
            <CartesianGrid strokeDasharray='3 3' style={{ marginBottom: 15 }} />
            <Tooltip />
            <Area
              isAnimationActive={true}
              type='monotone'
              dataKey='Spins'
              stroke='#2b2545'
              fillOpacity={1}
              fill='url(#colorUv)'
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (!this.state.summary.spins.length && !this.state.loading) {
      return (
        <div>
          <h3 style={{ fontWeight: "bold", color: "#2b2545" }}>No spins!</h3>
          <p>
            Please adjust your criteria, or{" "}
            <a
              style={{ textDecoration: "underline" }}
              href={"/search?track_title=" + encodeURI(this.state.track_title)}
            >
              search for this track
            </a>
            .
          </p>
        </div>
      );
    } else {
      return <p>Loading...</p>;
    }
  }

  render() {
    let displayTableStyle =
      this.state.summary.spins.length && !this.state.loading ? {} : { display: "none" };

    let metricsTableBody = (
      <Table.Body>
        <TableBodyLoader
          margin='4px 0'
          loading={!this.state.csvExport.length}
          cols={2}
          message='Loading Spin Metrics...'
        />
      </Table.Body>
    );

    if (this.state.csvExport.length) {
      metricsTableBody = (
        <Table.Body>
          <Table.Row>
            <Table.Cell>Best Week</Table.Cell>
            <Table.Cell>{this.state.summary.upper_bound}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Average Week</Table.Cell>
            <Table.Cell>{this.state.summary.average}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Total in Period</Table.Cell>
            <Table.Cell>{this.state.summary.spin_ct}</Table.Cell>
          </Table.Row>
        </Table.Body>
      );
    }

    return (
      <Segment id='spinSummary' className='page'>
        <div className='grid-x grid-margin-x'>
          <PageHeader
            h1='Track Summary'
            link={"/summary/track?track_gid=" + this.state.track_gid}
            iconName='headphones'
            instructions={this.state.weeks_shown_text}
            breadcrumbs_1={this.state.breadcrumbs_1 || "Artist..."}
            breadcrumbs_1_url={this.state.breadcrumbs_1_url || null}
            breadcrumbs_2={this.state.breadcrumbs_2 || ""}
            breadcrumbs_2_url={this.state.breadcrumbs_2_url || null}
          />

          <div className='cell medium-5 large-3'>
            {/* USER FILTERS */}
            <Input
              style={{ marginBottom: 15 }}
              label='Weeks:'
              fluid
              type='number'
              onChange={this.updateWeeksShown}
              value={this.state.weeks_shown}
            />
            <ChannelFiltering
              activeChannel={parseInt(this.state.channel)}
              onChange={this.updateChannel}
            />

            {/* RESPONSE METRICS */}
            <Table celled compact striped unstackable style={{ margin: "20px 0" }}>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell colSpan={2}>Spin Metrics</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              {metricsTableBody}
            </Table>
            {this.renderExportButton()}
          </div>

          {/* SPIN TABLE */}
          <div className='cell medium-7 large-9'>{this.renderSpinChart()}</div>

          <div className='cell small-12 table-scroll'>
            <Table size='small' celled compact striped unstackable style={displayTableStyle}>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Title</Table.HeaderCell>
                  <Table.HeaderCell>Artist</Table.HeaderCell>
                  <Table.HeaderCell>Channel</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Time</Table.HeaderCell>

                  {/* UTC for Debug */}
                  {/* <Table.HeaderCell>DB Time</Table.HeaderCell> */}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <TableBodyLoader
                  loading={this.state.loading}
                  cols={5}
                  message='Loading Track Summary...'
                  slow={true}
                />
                {this.state.summary.spins.map((spin, index) => {
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>{spin.title}</Table.Cell>
                      <Table.Cell>{spin.artist}</Table.Cell>
                      <Table.Cell>{spin.display_channel}</Table.Cell>
                      <Table.Cell>{spin.display_date}</Table.Cell>
                      <Table.Cell>{spin.display_time}</Table.Cell>
                      {/* <Table.Cell>{ spin.db_time }</Table.Cell> */}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
          <hr />
        </div>
      </Segment>
    );
  }
}
export default TrackSummary;
