import React from "react";
import axios from "axios";
import config from "react-global-configuration";
import Select from "react-select-virtualized";
import { Link, Redirect } from "react-router-dom";
import {
  // Segment,
  // Icon,
  Button,
  Form,
} from "semantic-ui-react";

import PageHeader from "../../components/PageHeader";

class TrackEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      track: {
        // DB RECORD
        track_gid: props.track_gid ? props.track_gid : null,
        artist_name: null,
        artist_id: props.artist_id ? props.artist_id : null,
        album_title: null,
        album_is_compilation: false,
        album_id: props.album_id ? props.album_id : null,
        track_title: "",
        track_isrc: "",
        track_num: 1,
        track_duration: "",
        alt_spellings: [],
      },

      dropdownAlbums: [],
      dropdownArtists: [],

      add: props.add,
      toListView: false, // Only true when we want to redirect to list view.
      toListViewUrl: "/tracks",

      alt_spelling_text: "Add Alternate Spelling",
      instructions: props.add ? "Now adding new track." : "Now editing the tracks.",
      breadcrumbs_1: props.add ? "New Track" : "", // API reponds
      breadcrumbs_2: props.add ? "Add" : "Edit",
    };

    this.saveTrack = this.saveTrack.bind(this);
    this.updateAlbum = this.updateAlbum.bind(this);
    this.updateArtist = this.updateArtist.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.getDropdownAlbums = this.getDropdownAlbums.bind(this);
    this.getDropdownArtists = this.getDropdownArtists.bind(this);
    this.addAlternateSpelling = this.addAlternateSpelling.bind(this);
    this.manageArtistGivenAlbum = this.manageArtistGivenAlbum.bind(this);
  }

  componentDidMount() {
    if (!this.state.add) {
      if (this.state.track.track_gid) {
        axios
          .post(config.get("api_url") + "tracks/load-track", {
            track_gid: this.state.track.track_gid,
          })
          .then((res) => {
            if (res.data.track) {
              this.setState(
                {
                  track: res.data.track,
                  breadcrumbs_1: res.data.track["track_title"],
                  instructions:
                    "Use the fields below to edit the metadata for " +
                    res.data.track["track_title"] +
                    ".",
                },
                () => {
                  // console.log(this.state.track);
                }
              );
            } else {
              console.log("No track received here!");
            }
          })
          .then(() => {
            // Delay these to first load track data.
            this.getDropdownAlbums(); // Get list of dropdown albums
            this.getDropdownArtists(); // Get list of dropdown artists
          });
      }
    } else {
      if (this.props.album_id) {
        this.manageArtistGivenAlbum(this.props.album_id);
        this.updateBreadcrumbs(this.props.album_id, "album_id");
      } else if (this.props.artist_id) {
        this.updateBreadcrumbs(this.props.artist_id, "artist_id");
      }
      this.getDropdownAlbums(); // Get list of dropdown albums
      this.getDropdownArtists(); // Get list of dropdown artists
    }
  }

  getDropdownAlbums() {
    axios.get(config.get("api_url") + "albums/load-for-dropdown").then((res) => {
      if (res.data.albums) {
        // console.log(res.data.albums);
        // console.log('RES DATA ALBUMS ^');
        this.setState(
          {
            dropdownAlbums: res.data.albums.map((album) => {
              return {
                value: album["album_id"],
                label: album["album_title"],
                artist_id: album["artist_id"],
              };
            }),
          },
          () => {
            console.log("Cannot get albums.");
            console.log(res.data);
          }
        );
      } else {
        console.log("NO RESPONSE FROM ALBUMS");
      }
    });
  }
  getDropdownArtists() {
    axios.get(config.get("api_url") + "artists/load-for-dropdown").then((res) => {
      if (res.data.artists !== undefined) {
        this.setState(
          {
            dropdownArtists: res.data.artists.map((artist) => {
              return {
                value: artist["artist_id"],
                label: artist["artist_name"],
              };
            }),
          },
          () => {
            // console.log("WE HAVE ARTISTS:");
            // console.log(this.state.dropdownArtists);
          }
        );
      } else {
        console.log("NO RESPONSE FROM dropdownArtists");
      }
    });
  }

  // HANDLE STANDARD INPUT CHANGE
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    const currTrack = this.state.track;
    if (name === "alt_spellings[0]") {
      // This would get out of hand if we used more than 4 ALTERNATES.
      currTrack.alt_spellings[0] = value;
    } else if (name === "alt_spellings[1]") {
      currTrack.alt_spellings[1] = value;
    } else if (name === "alt_spellings[2]") {
      currTrack.alt_spellings[2] = value;
    } else if (name === "alt_spellings[3]") {
      currTrack.alt_spellings[3] = value;
    } else {
      currTrack[name] = value;
    }
    this.setState(
      {
        track: currTrack, // New object with updated property.
      },
      () => {
        // console.log("handleInputChange ---> this.state.track");
        // console.log(this.state.track);
      }
    );
  }

  addAlternateSpelling() {
    this.setState(
      (prevState) => {
        var newTrack = prevState.track;
        newTrack.alt_spellings.push("");
        return {
          track: newTrack,
        };
      },
      () => {
        // console.log('state after adding alt spelling:');
        // console.log(this.state);
      }
    );
  }

  manageArtistGivenAlbum(album_id) {
    axios.post(config.get("api_url") + "albums/edit-album", { album_id: album_id }).then((res) => {
      if (res.data.album) {
        let newTrack = this.state.track;
        newTrack["artist_name"] = res.data.album["artist_name"];
        newTrack["album_is_compilation"] = res.data.album["album_is_compilation"];
        if (res.data.album_is_compilation) {
          newTrack["artist_id"] = null;
        } else {
          newTrack["artist_id"] = res.data.album.artist_id;
        }
        this.setState({ track: newTrack });
      } else {
        console.log("Failed to get album with id: " + album_id);
      }
    });
  }

  updateBreadcrumbs(id, field) {
    const endpoint =
      field === "album_id" ? "albums/album-title-by-id" : "artists/artist-name-by-id";
    axios.post(config.get("api_url") + endpoint, { id: id }).then((res) => {
      if (res.data.name) {
        this.setState({
          breadcrumbs_1: res.data.name,
        });
      } else {
        console.log("Failed to update BCs!");
        console.log(res.data);
      }
    });
  }

  // Thoughts: Get a new album ID into the state.
  // Then, query the DB for other stuff about that album,
  //   including whether or not we need to assign an artist_id
  updateAlbum = (event) => {
    let track, album_id, album_title;
    if (event) {
      album_id = event.value;
      album_title = event.label;
    } else {
      console.log("No event in updateAlbum");
    }
    this.setState(
      (prevState) => {
        track = prevState.track;
        track["album_id"] = album_id;
        track["album_title"] = album_title;
        return { track: track };
      },
      () => {
        this.manageArtistGivenAlbum(album_id);
      }
    );
  };

  // Update state with artist data
  updateArtist = (event) => {
    let track, artist_id, artist_name;
    if (event) {
      artist_id = event.value;
      artist_name = event.label;
    } else {
      console.log("In the else, which is strange...");
      artist_id = 0;
      artist_name = "Compilation";
    }
    this.setState(
      (prevState) => {
        track = prevState.track;
        track["artist_id"] = artist_id;
        track["artist_name"] = artist_name;
        return { track: track };
      },
      () => {
        // console.log("Artist updated!");
        // console.log(this.state.track);
      }
    );
  };

  saveTrack() {
    // console.log("WE WILL SAVE THIS TRACK:");
    // console.log(this.state.track);
    // Post this.state.track to endpoint.
    const postData = {
      track: this.state.track,
      add: this.state.add,
    };
    axios.post(config.get("api_url") + "tracks/save", postData).then((res) => {
      if (res.data.track) {
        // console.log("SAVED!");
        // console.log(res.data);
        this.setState((prevState) => {
          var newTrack = prevState.track;
          var instructions =
            "Successfully " +
            (prevState.add ? "add" : "updat") +
            "ed " +
            newTrack["track_title"] +
            "!";
          newTrack["track_gid"] = res.data.track["track_gid"];
          return {
            add: false, // NO MORE ADDING AFTER ANY POST
            track: newTrack,
            breadcrumbs_1: newTrack["track_title"],
            instructions: instructions,
          };
        });
      } else {
        // console.log();
      }
    });
    // Then...
    // Set behavior based on result.
  }

  render() {
    if (this.state.toListView === true) {
      return <Redirect to={this.state.toListViewUrl || "/tracks"} />;
    }

    // Handle alternate spellings. ALWAYS a part of the this.state.track OBJECT.
    let showSpellingClass = this.state.track["alt_spellings"] ? "yes-spelling" : "no-spelling";
    let altSpellingMarkup = this.state.track["alt_spellings"].map((spelling, index) => {
      return (
        <Form.Input
          key={index}
          onChange={this.handleInputChange}
          name={"alt_spellings[" + index + "]"}
          label='Alternate Spelling'
          value={this.state.track["alt_spellings"][index] || ""}
        />
      );
    });

    return (
      <div className='grid-x grid-margin-x'>
        {/* PAGE HEADER + BREADCRUMBS */}
        <PageHeader
          h1='Tracks'
          link='/tracks'
          iconName='list'
          breadcrumbs_1={this.state.breadcrumbs_1}
          breadcrumbs_1_href={this.state.breadcrumbs_1_href}
          breadcrumbs_2={this.state.breadcrumbs_2}
          instructions={this.state.instructions}
        />

        <div className='cell large-7 medium-12'>
          <Form autoComplete='off'>
            <Form.Input
              onChange={this.handleInputChange}
              name='track_title'
              label='Track Title'
              value={this.state.track["track_title"] || ""}
            />

            <div className='field'>
              <div className={showSpellingClass}>{altSpellingMarkup}</div>

              <div id='altSpellingContainer'>
                <Button
                  onClick={this.addAlternateSpelling}
                  circular
                  size='mini'
                  icon='plus'
                  style={{ marginTop: "7px" }}
                ></Button>
                <p style={{ display: "inline", marginLeft: "5px" }}>Add Alternate Spelling</p>
              </div>
            </div>

            {/* SHOW ALBUM NO MATTER WHAT */}
            <div className='field'>
              <label>Album</label>
              <Select
                value={this.state.dropdownAlbums.filter(
                  (option) => option.value === this.state.track["album_id"]
                )}
                options={this.state.dropdownAlbums}
                onChange={(e) => this.updateAlbum(e)}
              />
            </div>

            {/* ARTIST */}
            <div className='field'>
              <label>Artist</label>
              <Select
                isDisabled={!this.state.track["album_is_compilation"]}
                value={this.state.dropdownArtists.filter(
                  (option) => option.value === this.state.track["artist_id"]
                )}
                options={this.state.dropdownArtists}
                onChange={(e) => this.updateArtist(e)}
              />
            </div>

            <Form.Input
              onChange={this.handleInputChange}
              name='track_isrc'
              label='ISRC'
              value={this.state.track["track_isrc"] || ""}
            />

            <Form.Group widths='equal'>
              <Form.Input
                onChange={this.handleInputChange}
                name='track_duration'
                label='Duration'
                value={this.state.track["track_duration"] || ""}
              />

              <Form.Input
                onChange={this.handleInputChange}
                name='track_num'
                type='number'
                label='Track Number'
                value={this.state.track["track_num"] || ""}
              />
            </Form.Group>

            {/*
						<Form.Group widths='equal' className={showSpellingClass}>
							{altSpellingMarkup}
						</Form.Group>
						<div id="altSpellingContainer">
							<Button onClick={this.addAlternateSpelling} circular size='mini' icon='plus'></Button>
							<p style={{display:"inline", marginLeft: "5px"}}>Add Alternate Spelling</p>
						</div>
						*/}
            <Form.Group>
              <Form.Button
                onClick={(e) => {
                  this.saveTrack();
                }}
                primary
                size='small'
              >
                Save Track
              </Form.Button>
              <Link to={"/tracks/album/" + this.state.track["album_id"]}>
                <Form.Button secondary size='small' style={{ marginRight: "12px" }}>
                  Back to Album
                </Form.Button>
              </Link>
              <Link to={"/tracks/artist/" + this.state.track["artist_id"]}>
                <Form.Button secondary size='small' style={{ marginRight: "12px" }}>
                  Back to Artist
                </Form.Button>
              </Link>
            </Form.Group>
          </Form>
        </div>
      </div>
    );
  }
}

export default TrackEdit;
