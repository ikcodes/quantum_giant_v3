import React from "react";
import axios from "axios";
import config from "react-global-configuration";
import PageHeader from "../components/PageHeader";

import {
  Button,
  // Checkbox,
  // Form,
  Segment,
  Table,
  // Icon,
} from "semantic-ui-react";

import TableBodyLoader from "../components/TableBodyLoader";
import TableActionButton from "../components/TableActionButton";

class Commercials extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trash: [],
      new_trash: "",
      busy_text: "",
      loading: true,
    };
    this.getCommercials = this.getCommercials.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    return this.getCommercials();
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const new_trash = value;
    this.setState({
      new_trash: new_trash,
    });
  }

  getCommercials() {
    axios.get(config.get("api_url") + "commercials/get").then((res) => {
      if (res.data.trash) {
        this.setState({
          trash: res.data.trash,
          loading: false,
        });
      } else {
        alert("no trash! Check console.");
      }
    });
  }

  removeFromCommercials(trash_id) {
    const postData = {
      trash_id: trash_id,
      qg3: "qg4",
    };
    axios.post(config.get("api_url") + "commercials/delete", postData).then((res) => {
      if (res.data.success) {
        this.setState(
          {
            new_trash: "",
          },
          () => {
            this.getCommercials();
          }
        );
      }
    });
  }

  render() {
    return (
      <Segment id='spins' className='page grid-container'>
        <div className='grid-x grid-margin-x'>
          <PageHeader
            h1='Commercials'
            link='/commercials'
            iconName='trash'
            instructions='Spins below have been flagged as Commercials - please remove them from the list below if they are NOT commercials. Every item in this list will be ommitted from searches, Top Spinners results, etc.'
          />

          <div className='cell'>
            {/* RESULTS TABLE */}
            <Table celled striped compact size='small' unstackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Track Title</Table.HeaderCell>
                  <Table.HeaderCell>Artist</Table.HeaderCell>
                  <Table.HeaderCell>Number Of Occurrances</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <TableBodyLoader
                  loading={this.state.loading}
                  cols={4}
                  message='Loading Commercials...'
                  slow={false}
                />
                {this.state.trash.map((trash) => {
                  return (
                    <Table.Row key={trash["trash_id"] || ""}>
                      <Table.Cell>{trash["title"]}</Table.Cell>
                      <Table.Cell>{trash["artist"]}</Table.Cell>
                      <Table.Cell collapsing>{trash["trash_ct"]}</Table.Cell>
                      <Table.Cell collapsing>
                        <Button.Group basic size='small'>
                          <TableActionButton
                            link={false}
                            actionName={"This is NOT a Commercial"}
                            actionIcon='trash'
                            onClick={() => {
                              this.removeFromCommercials(trash["trash_id"]);
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
      </Segment>
    );
  }
}

export default Commercials;
