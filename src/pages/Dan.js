import React from "react";
import axios from "axios";
import queryString from "query-string";
import config from "react-global-configuration";
import PageHeader from "../components/PageHeader";
import TableBodyLoader from "../components/TableBodyLoader";
import DateFiltering from "../components/DateFiltering";
import { Button, Segment, Table } from "semantic-ui-react";

import { CSVLink } from "react-csv";

class DanSummary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      custom_dates: {
        start: "",
        end: "",
      },
      loading: false,
      just_loaded: false,
      spinSummary: [],
      // channel: 0,
      csvExport: [[]],
      csvFilename: "", // Not declared but it gets set
      exportButtonMarkup: "",
    };

    this.wipeResults = this.wipeResults.bind(this);
    // this.updateChannel = this.updateChannel.bind(this);
    this.updateDanSummary = this.updateDanSummary.bind(this);
    this.renderExportButton = this.renderExportButton.bind(this);
  }
  componentDidMount() {
    const init_qv = queryString.parse(this.props.location.search);
    if (init_qv.start_date || init_qv.end_date || init_qv.go) {
      var dates = {
        start: this.state.custom_dates.start,
        end: this.state.custom_dates.end,
      };
      if (init_qv.start_date) {
        dates["start"] = init_qv.start_date;
      }
      if (init_qv.end_date) {
        dates["end"] = init_qv.end_date;
      }
      this.setState(
        {
          custom_dates: dates, // Ok no matter what; blank => blank if just 'go'
        },
        () => {
          if (parseInt(init_qv.go) === 1) {
            // Shortcut to GO
            this.updateDanSummary();
          }
        }
      );
    }
  }

  updateStartDate = (event, { name, value }) => {
    var custom_dates = { ...this.state.custom_dates };
    custom_dates.start = value;
    this.setState({ custom_dates }, () => {
      if (this.state.just_loaded) {
        this.wipeResults();
      }
    });
  };

  updateDanSummary() {
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
        };

        axios.post(config.get("api_url") + "dan/export", postData).then((res) => {
          if (res.data.summary) {
            this.setState(
              {
                spinSummary: res.data.summary,
                csvExport: res.data.summary,
                csvFilename: res.data.csv_filename,
                loading: false,
                just_loaded: true,
              },
              () => {
                this.renderExportButton();
              }
            );
          } else {
            console.log("Could not get shit!!!! No res.data.summary!");
            console.log(res.data);
          }
        });
      }
    );
  }

  renderExportButton() {
    if (this.state.csvExport.length > 1) {
      // Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
      var mkp = (
        <CSVLink data={this.state.csvExport} filename={this.state.csvFilename}>
          <Button style={{ marginBottom: 15, marginTop: 15, width: "100%" }} primary>
            Export Summary
          </Button>
        </CSVLink>
      );
      this.setState({
        exportButtonMarkup: mkp,
      });
    } else {
      this.setState({
        exportButtonMarkup: (
          <Button style={{ marginBottom: 15, marginTop: 15, width: "100%" }} primary disabled>
            Loading Summary...
          </Button>
        ),
      });
    }
  }

  wipeResults() {
    this.setState({
      loading: false,
      spinSummary: [],
      csvExport: [[]],
      csvFilename: "", // Not declared but it gets set
      exportButtonMarkup: "",
    });
  }

  render() {
    // let tableStyle={
    // 	display: this.state.spinSummary.length ? 'table' : 'none'
    // }

    return (
      <Segment id='spinSummary' className='page'>
        <div className='grid-x grid-margin-x'>
          <PageHeader
            h1='Filemaker Export'
            link='/filemaker'
            iconName='file'
            instructions='You know what to do! ;)'
            breadcrumbs_1={this.state.weeks_back_text}
            // breadcrumbs_2={ this.state.weeks_back_text && this.state.channel === 105 ? "She's So Funny" : '' }
          />

          {/* CUSTOM DATE FILTERS */}
          <div className='cell'>
            <div className='grid-x'>
              <div className='cell large-6'>
                <div className='grid-x grid-margin' style={{ position: "relative" }}>
                  <div className='cell' style={{ marginTop: 0 }}>
                    <div className='ui form'>
                      <div className='ui field'>
                        <label style={{ minWidth: 100 }}>Week Start</label>
                        <p className='smalltext'>
                          Start of desired week. All other dates auto-generate based on this value.
                        </p>
                        <DateFiltering
                          placeholder='Week start...'
                          onChange={this.updateStartDate}
                          value={this.state.custom_dates.start}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='cell' style={{ marginTop: 15 }}>
                    {/* <Button id='queryCustomDates' onClick={ this.updateDanSummary } primary>Query Custom Dates</Button> */}
                    <Button
                      style={{ width: "100%" }}
                      onClick={this.updateDanSummary}
                      disabled={this.state.loading}
                      primary
                    >
                      Go!
                    </Button>
                  </div>
                  <div className='cell'>{this.state.exportButtonMarkup}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS TABLE */}
          <div className='cell large-6'>
            <Table celled compact striped style={{ marginTop: 30 }}>
              {/* TABLE HEADER & NAVIGATION */}
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Data</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <TableBodyLoader
                  loading={this.state.loading}
                  cols={1}
                  message='Loading Filemaker Summary... (Estimated time: 1-2 minutes)'
                  slow={true}
                />
                {this.state.spinSummary.map((spin_count, index) => {
                  // var searchUrl = '/search?artist_name='+encodeURI(spin_count['artist_name'])
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>{JSON.stringify(spin_count)}</Table.Cell>
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

export default DanSummary;
