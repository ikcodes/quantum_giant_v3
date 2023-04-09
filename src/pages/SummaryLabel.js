// Packages
import React from "react";
import axios from "axios";
import queryString from "query-string";
import config from "react-global-configuration";

// Components
import PageHeader from "../components/PageHeader";
import TableBodyLoader from "../components/TableBodyLoader";
import ChannelFiltering from "../components/ChannelFiltering";
import DateFiltering from "../components/DateFiltering";

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
import { Button, Input, Segment, Table, Radio, Menu, Icon } from "semantic-ui-react";
import { CSVLink } from "react-csv";

//===================================================

class LabelSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      custom_range: false, // Switch between week (DEFAULT) and custom range
      custom_dates: {
        start: "",
        end: "",
      },

      loading: true,
      label_id: 0,
      label_name: "",

      channel: 0, // 0 = all
      weeks_shown: 4,
      weeks_shown_text: "Now viewing all spins in the Last 4 weeks.",
      summary: {
        spins: [],
        chartData: [],
      },
      csvExport: [[]],
      csv_ready: false,
      csv_downloading: false,

      pagination: [],
      pages: 1, // for chevrons
      page: 1,
    };
    this.updateChannel = this.updateChannel.bind(this);
    this.spinPagination = this.spinPagination.bind(this);
    this.generateExport = this.generateExport.bind(this);
    this.queryForSummary = this.queryForSummary.bind(this);
    this.updateWeeksShown = this.updateWeeksShown.bind(this);
    this.renderExportButton = this.renderExportButton.bind(this);
    this.convertWeeksToText = this.convertWeeksToText.bind(this);
    this.activateCustomDates = this.activateCustomDates.bind(this);
    this.deactivateCustomDates = this.deactivateCustomDates.bind(this);
  }

  componentDidMount() {
    const init_qv = queryString.parse(this.props.location.search);
    if (init_qv.start_date && init_qv.end_date) {
      var custom_dates = { ...this.state.custom_dates };
      custom_dates.start = init_qv.start_date;
      custom_dates.end = init_qv.end_date;
      var updatedState = {
        custom_range: true,
        weeks_shown_text: "Now viewing all spins in a Custom Date Range.",
        custom_dates: custom_dates,
      };
      this.setState(updatedState, () => this.queryForSummary());
    } else if (init_qv.start_date) {
      var custom_dates2 = { ...this.state.custom_dates };
      custom_dates2.start = init_qv.start_date;
      var updatedState2 = {
        custom_range: true,
        weeks_shown_text: "Now viewing all spins in a Custom Date Range.",
        custom_dates: custom_dates2,
      };
      this.setState(updatedState2, () => this.queryForSummary());
    } else if (init_qv.weeks || init_qv.channel) {
      this.setState(
        {
          // Start out with this state, but also let it be updated later.
          channel: parseInt(init_qv.channel) || this.state.channel,
          weeks_shown: parseInt(init_qv.weeks) || this.state.weeks_shown,
        },
        () => this.queryForSummary()
      );
    } else {
      this.queryForSummary();
    }
  }

  activateCustomDates() {
    this.setState(
      {
        csvExport: [[]],
        csv_ready: false,
        custom_range: true,
        summary: {
          spins: [],
          chartData: [],
        },
        weeks_shown_text: "Now viewing all spins in a Custom Date Range.",
        pagination: [],
        pages: 1,
        page: 1,
      },
      () => {
        if (this.state.custom_dates.start.length) {
          this.queryForSummary();
        }
      }
    );
  }

  deactivateCustomDates() {
    var weekText = this.convertWeeksToText(this.state.weeks_shown);
    this.setState(
      {
        custom_range: false,
        weeks_shown_text: "Now viewing all spins in the " + weekText + ".",
        csvExport: [[]],
        csv_ready: false,
        summary: {
          spins: [],
          chartData: [],
        },
        pagination: [],
        pages: 1,
        page: 1,
      },
      () => {
        this.queryForSummary();
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

  updateChannel = (event, { name, value }) => {
    if (event) {
      const channelId = event.value;
      this.setState(
        {
          channel: channelId,
        },
        () => {
          if (this.state.custom_range === true) {
            this.queryForSummary();
          } else {
            this.queryForSummary();
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
            this.queryForSummary();
          } else {
            this.queryForSummary();
          }
        }
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

  spinPagination(pageNum) {
    this.setState(
      (prevState) => {
        let newSummary = prevState["summary"];
        newSummary.spins = [];
        return {
          tableLoading: true,
          summary: newSummary,
          page: pageNum,
        };
      },
      () => this.queryForNextPage()
    );
  }

  renderSpinChart() {
    console.log("---> STATE FOR THANG <--", this.state);
    if (
      ((!this.state.loading && this.state.custom_range !== true) ||
        (this.state.summary.spins.length && this.state.tableLoading)) &&
      this.state.summary.chartData.length
    ) {
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
    } else if (this.state.custom_range === true) {
      return <p>&nbsp;</p>;
    } else if (
      !this.state.summary.spins.length &&
      !this.state.tableLoading &&
      !this.state.loading
    ) {
      return (
        <div>
          <h3 style={{ fontWeight: "bold", color: "#2b2545" }}>No spins!</h3>
          <p>Please adjust your criteria, or try searching with different criteria.</p>
        </div>
      );
    } else {
      return <p>Loading...</p>;
    }
  }

  renderExportButton() {
    if (this.state.csvExport.length > 1) {
      // Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
      return (
        <CSVLink data={this.state.csvExport} filename={this.state.csvFilename}>
          <Button style={{ marginBottom: 30, width: "100%" }} secondary>
            Click to Download
          </Button>
        </CSVLink>
      );
    } else {
      return (
        <Button
          disabled={this.state.csv_ready || this.state.loading || this.state.csvExport.length > 1}
          // disabled={ !this.state.csv_ready || this.state.loading }
          style={{ marginBottom: 15, width: "100%" }}
          primary
          onClick={this.generateExport}
        >
          {this.state.csv_ready ? "Preparing Download..." : "Export Label Summary"}
        </Button>
      );
    }
  }

  generateExport() {
    this.setState(
      {
        csv_ready: true, // I just don't know... why?
        csv_downloading: true,
      },
      () => {
        var csvPost = {
          label_id: this.state.label_id,
          channel: this.state.channel,
        };
        if (this.state.custom_range === true) {
          if (this.state.custom_dates.start) {
            csvPost["start_date"] = this.state.custom_dates.start;
            csvPost["custom"] = true;
          }
          if (this.state.custom_dates.end) {
            csvPost["end_date"] = this.state.custom_dates.end;
            csvPost["custom"] = true;
          }
          if (this.state.custom_dates.start === "" && this.state.custom_dates.end === "") {
            alert("There was an error. Please try again.");
            csvPost["custom"] = false;
          }
        } else {
          csvPost["weeks"] = this.state.weeks_shown;
          csvPost["custom"] = false;
        }
        axios.post(config.get("api_url") + "label/summary-csv", csvPost).then((res) => {
          if (res.data.csv.length) {
            this.setState(
              {
                csv_ready: false, // Flip it back, who knows...
                csv_downloading: false,
                csvExport: res.data.csv,
                csvFilename: res.data.filename,
              },
              () => this.renderExportButton
            );
          }
        });
      }
    );
  }

  queryForSummary() {
    let queryValues = queryString.parse(this.props.location.search);
    if (queryValues.label_id) {
      this.setState(
        {
          label_id: parseInt(queryValues.label_id),
          csvExport: [],
          loading: true,
        },
        () => {
          this.renderExportButton();
          var postData = {
            label_id: this.state.label_id,
          };
          axios.post(config.get("api_url") + "label/label-name-by-id", postData).then((res) => {
            if (res.data.label_name) {
              this.setState(
                {
                  label_name: res.data.label_name,
                },
                () => {
                  var summaryPost = {
                    label_id: this.state.label_id,
                    channel: this.state.channel,
                    page: this.state.page,
                  };
                  if (this.state.custom_range === true) {
                    if (this.state.custom_dates.start) {
                      summaryPost["start_date"] = this.state.custom_dates.start;
                      summaryPost["custom"] = true;
                    }
                    if (this.state.custom_dates.end) {
                      summaryPost["end_date"] = this.state.custom_dates.end;
                      summaryPost["custom"] = true;
                    }
                    if (
                      this.state.custom_dates.start === "" &&
                      this.state.custom_dates.end === ""
                    ) {
                      alert("There was an error. Please try again.");
                      summaryPost["custom"] = false;
                    }
                  } else {
                    summaryPost["weeks"] = this.state.weeks_shown;
                    summaryPost["custom"] = false;
                  }
                  axios.post(config.get("api_url") + "label/summary", summaryPost).then((res) => {
                    let newWeekText = this.convertWeeksToText(this.state.weeks_shown);
                    this.setState(
                      {
                        loading: false,
                        csvExport: res.data.csv,
                        summary: res.data,
                        weeks_shown_text: "Now viewing all spins in the " + newWeekText + ".",

                        // Pagination
                        pagination: res.data.pagination,
                        pages: res.data.pages,
                      },
                      () => this.renderExportButton()
                    );
                  });
                }
              );
            }
          });
        }
      );
    } else {
      console.log("We need an LABEL ID to run this function.");
      this.setState({
        loading: false,
      });
    }
  }

  // ONLY RUNS ON PAGINATION
  //===========================
  queryForNextPage() {
    this.renderExportButton();
    this.setState(
      {
        tableLoading: true,
      },
      () => {
        var summaryPost = {
          label_id: this.state.label_id,
          channel: this.state.channel,
          page: this.state.page,
        };
        if (this.state.custom_range === true) {
          if (this.state.custom_dates.start) {
            summaryPost["start_date"] = this.state.custom_dates.start;
            summaryPost["custom"] = true;
          }
          if (this.state.custom_dates.end) {
            summaryPost["end_date"] = this.state.custom_dates.end;
            summaryPost["custom"] = true;
          }
          if (this.state.custom_dates.start === "" && this.state.custom_dates.end === "") {
            alert("There was an error. Please try again.");
            summaryPost["custom"] = false;
          }
        } else {
          summaryPost["weeks"] = this.state.weeks_shown;
          summaryPost["custom"] = false;
        }
        axios.post(config.get("api_url") + "label/summary", summaryPost).then((res) => {
          let newWeekText = this.convertWeeksToText(this.state.weeks_shown);
          this.setState(
            {
              tableLoading: false,
              csvExport: res.data.csv,
              summary: res.data,
              weeks_shown_text: "Now viewing all spins in the " + newWeekText + ".",

              // Pagination
              pagination: res.data.pagination,
              pages: res.data.pages,
            },
            () => this.renderExportButton()
          );
        });
      }
    );
  }

  render() {
    let displayWeeksShown = this.state.custom_range ? { display: "none" } : { marginBottom: 15 };
    let displayCustomDates = this.state.custom_range ? { marginBottom: 15 } : { display: "none" };

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

    if (!this.state.loading) {
      metricsTableBody = (
        <Table.Body>
          <Table.Row style={displayWeeksShown}>
            <Table.Cell>Best Week</Table.Cell>
            <Table.Cell>{this.state.summary.upper_bound}</Table.Cell>
          </Table.Row>
          <Table.Row style={displayWeeksShown}>
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
            h1='Label Summary'
            link={"/summary/label?label_id=" + this.state.label_id}
            iconName='headphones'
            instructions={this.state.weeks_shown_text}
            breadcrumbs_1={this.state.label_name || "Label..."}
            breadcrumbs_1_url={this.state.breadcrumbs_1_url || null}
          />
          <div id='queryCustomDatesContainer'>
            <Radio
              toggle
              checked={this.state.custom_range}
              onChange={
                this.state.custom_range === true
                  ? this.deactivateCustomDates
                  : this.activateCustomDates
              }
              label='Custom Dates'
              style={{ marginBottom: 15 }}
            />
          </div>

          {/* USER FILTERS */}
          <div className='cell medium-5 large-3'>
            <Input
              style={displayWeeksShown}
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
          <div style={displayWeeksShown} className='cell medium-7 large-9'>
            {this.renderSpinChart()}
          </div>

          <div style={displayCustomDates} className='cell medium-7 large-9 ui form'>
            <div className='grid-x align-middle'>
              <div className='cell medium-shrink'>
                <div className='field'>
                  <label style={{ minWidth: 100 }}>Start Date</label>
                </div>
              </div>
              <div
                className='cell medium-auto large-shrink'
                style={{ minWidth: 300, marginBottom: 15 }}
              >
                <DateFiltering
                  placeholder='Starting on...'
                  onChange={this.updateStartDate}
                  value={this.state.custom_dates.start}
                />
              </div>
            </div>
            <div className='grid-x align-middle'>
              <div className='cell medium-shrink'>
                <div className='field'>
                  <label style={{ minWidth: 100 }}>End Date</label>
                </div>
              </div>
              <div
                className='cell medium-auto large-shrink'
                style={{ minWidth: 300, marginBottom: 15 }}
              >
                <DateFiltering
                  placeholder='Ending on...'
                  onChange={this.updateEndDate}
                  value={this.state.custom_dates.end}
                />
              </div>
            </div>
            <div className='grid-x align-middle'>
              <div className='cell'>
                <Button id='queryCustomDates' onClick={this.queryForSummary} primary>
                  Query Custom Dates
                </Button>
              </div>
            </div>
          </div>

          <div className='cell small-12 table-scroll'>
            <Table
              size='small'
              celled
              compact
              striped
              unstackable
              style={
                this.state.loading ||
                (!this.state.summary.spins.length && !this.state.pagination.length)
                  ? { display: "none" }
                  : {}
              }
            >
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Title</Table.HeaderCell>
                  <Table.HeaderCell>Artist</Table.HeaderCell>
                  <Table.HeaderCell>Album</Table.HeaderCell>
                  <Table.HeaderCell>Channel</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Time</Table.HeaderCell>

                  {/* UTC for Debug */}
                  {/* <Table.HeaderCell>DB Time</Table.HeaderCell> */}
                </Table.Row>

                {/* PAGINATION */}
                <Table.Row style={this.state.no_spins ? { display: "none" } : {}}>
                  <Table.HeaderCell textAlign='center' colSpan={6}>
                    <Menu compact secondary size='mini'>
                      <Menu.Item
                        as='a'
                        icon
                        disabled={this.state.page <= 1}
                        onClick={() => {
                          if (this.state.page > 1) {
                            this.spinPagination(this.state.page - 1);
                          }
                        }}
                      >
                        <Icon name='chevron left' />
                      </Menu.Item>
                      {this.state.pagination.map((pageNum) => {
                        return (
                          <Menu.Item
                            active={this.state.page === pageNum}
                            onClick={() => this.spinPagination(pageNum)}
                            key={pageNum}
                            as='a'
                          >
                            {pageNum}
                          </Menu.Item>
                        );
                      })}
                      <Menu.Item
                        as='a'
                        icon
                        disabled={this.state.page >= this.state.pages}
                        onClick={() => {
                          if (this.state.page < this.state.pages) {
                            this.spinPagination(this.state.page + 1);
                          }
                        }}
                      >
                        <Icon name='chevron right' />
                      </Menu.Item>
                    </Menu>
                  </Table.HeaderCell>
                </Table.Row>
                {/* END PAGINATION */}
              </Table.Header>
              <Table.Body>
                <TableBodyLoader
                  loading={this.state.loading || this.state.tableLoading}
                  cols={6}
                  message={
                    this.state.tableLoading ? "Loading Next Page..." : "Loading Label Summary..."
                  }
                  slow={true}
                />
                {this.state.summary.spins.map((spin, index) => {
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>{spin.title}</Table.Cell>
                      <Table.Cell>{spin.artist}</Table.Cell>
                      <Table.Cell>{spin.display_album}</Table.Cell>
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
export default LabelSummary;
