import React from "react";
import axios from "axios";
import config from "react-global-configuration";
import { Link, Redirect } from "react-router-dom";
import {
  Form,
  // Segment,
  // Icon,
  // Button,
  // Radio,
  // Input,
  // Table,
} from "semantic-ui-react";

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
      labelId: props.labelId,

      // DB record
      label: {
        label_id: "",
        label_name: "",
        label_key: "",
        web: 0,
      },

      nowPlaying: {
        title: "",
        album: "",
        artist: "",
      },

      success: false,

      instructions: props.add ? "Now adding new label." : "Now editing the label.", // POST OR SESSION? BOTH?
      breadcrumbs_1: props.add ? "New Channel" : "", // API reponds
      breadcrumbs_2: props.add ? "Add" : "Edit",
    };

    this.addLabel = this.addLabel.bind(this);
    this.saveLabel = this.saveLabel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    // Get current label (label_id passed from ChannelPage)
    const postData = {
      label_id: this.state.labelId,
    };
    if (this.state.add) {
      this.setState({
        instructions: "Adding new label.",
      });
    } else {
      axios.post(config.get("api_url") + "label/edit-label", postData).then((res) => {
        if (res.data.label) {
          this.setState({
            label: res.data.label,

            // CASE: Number changes (sat => web), endpoint tries to load old one
            number_changed: false,
            old_number: parseInt(res.data.label.label_id),

            breadcrumbs_1: res.data.label["label_name"],
            instructions: "Now editing label metadata for " + res.data.label["label_name"] + ".",
          });
        } else {
          console.log("Problem getting label!!");
        }
      });
    }
  }

  addLabel() {
    this.setState(
      {
        label: {},
        breadcrumbs_1: "New Label",
        instructions: "Now adding new label! Hooray!",
        showSpellingClass: false,
      },
      () => {}
    );
  }

  saveLabel() {
    if (this.state.label["label_name"]) {
      const saveData = {
        add: this.state.add,
        label_id: this.state.label["label_id"],
        label_name: this.state.label["label_name"],
      };
      axios.post(config.get("api_url") + "label/update-label", saveData).then(() => {
        this.setState({
          toListView: true,
        });
      });
    } else {
      // No name. Bail out.
      alert("Please enter a label name to continue.");
    }
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    const currChannel = this.state.label;
    currChannel[name] = value;
    this.setState({
      label: currChannel, // New object with updated property.
    });
  }

  render() {
    // Only take out for dev
    if (this.state.toListView === true) {
      return <Redirect to={this.state.toListViewUrl || "/label"} />;
    }

    return (
      <div className='grid-x grid-margin-x'>
        {/* PAGE HEADER + BREADCRUMBS */}
        <PageHeader
          h1='Labels'
          link='/label'
          iconName='user'
          breadcrumbs_1={this.state.breadcrumbs_1}
          breadcrumbs_2={this.state.breadcrumbs_2}
          // instructions={this.state.instructions}
        />

        {/*==============*/}
        {/* LABEL FORM */}
        {/*==============*/}
        <div className='cell large-6 medium-12'>
          <Form autoComplete='off'>
            <div className='grid-x grid-margin-x' style={{ paddingBottom: 20 }}>
              <div className='cell'>
                <Form.Input
                  onChange={this.handleInputChange}
                  name='label_name'
                  label='Label Name'
                  value={this.state.label["label_name"] || ""}
                />
              </div>
            </div>
            <Form.Group>
              <Form.Button onClick={(e) => this.saveLabel()} primary>
                Save Label
              </Form.Button>
              <Link to={"/label"}>
                <Form.Button primary style={{ marginRight: "12px" }}>
                  Back to Labels
                </Form.Button>
              </Link>
            </Form.Group>
          </Form>
        </div>
      </div>
    );
  }
}

export default ChannelEdit;
