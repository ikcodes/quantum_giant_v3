// Packages
import React from "react";
import axios from "axios";
import config from "react-global-configuration";

// Components
import PageHeader from "../components/PageHeader";
import TableBodyLoader from "../components/TableBodyLoader";
import TableActionButton from "../components/TableActionButton";

// Semantic Elements
import { Segment, Button, Table } from "semantic-ui-react";

//===================================================

class LabelList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      instructions: "Please select your label from the list below",
      labels: [],
    };
    this.loadLabels = this.loadLabels.bind(this);
  }

  componentDidMount() {
    this.loadLabels();
  }

  loadLabels() {
    axios.post(config.get("api_url") + "label/list").then((res) => {
      this.setState({
        labels: res.data.labels,
      });
    });
  }

  render() {
    return (
      <Segment id='spinSummary' className='page'>
        <div className='grid-x grid-margin-x'>
          <PageHeader
            h1='Label'
            link={"/label?label_id=" + this.state.label_id}
            instructions={this.state.instructions}
            iconName='ticket'
            // breadcrumbs_1={ this.state.label_name || '' }
            // breadcrumbs_1_url={ this.state.breadcrumbs_1_url || null }
          />

          {/* RESULTS TABLE */}
          <div className='cell small-12'>
            <div className='grid-x'>
              <div className='cell large-8'>
                <Table celled striped unstackable>
                  {/* TABLE HEADER & NAVIGATION */}
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Labels</Table.HeaderCell>
                      <Table.HeaderCell>Summary</Table.HeaderCell>
                      <Table.HeaderCell>Albums</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <TableBodyLoader
                      loading={this.state.loading}
                      cols={2}
                      message='Loading Labels...'
                      slow={false}
                    />
                    {this.state.labels.map((label, index) => {
                      return (
                        <Table.Row key={index}>
                          <Table.Cell>{label["label_name"]}</Table.Cell>
                          <Table.Cell collapsing style={{ textAlign: "center" }}>
                            <Button.Group basic size='small'>
                              <TableActionButton
                                link={"/summary/label?label_id=" + label["label_id"]}
                                actionName='View Label Summary'
                                actionIcon='chart pie'
                              />
                            </Button.Group>
                          </Table.Cell>
                          <Table.Cell collapsing style={{ textAlign: "center" }}>
                            <Button.Group basic size='small'>
                              <TableActionButton
                                link={"/albums/label/" + label["label_id"]}
                                actionName='View All Albums'
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
          </div>
        </div>
      </Segment>
    );
  }
}
export default LabelList;
