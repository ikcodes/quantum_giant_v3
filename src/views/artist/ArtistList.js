import React from "react";
import axios from "axios";
// import { Link } from 'react-router-dom';
import config from "react-global-configuration";
import {
  Button,
  Icon,
  Menu,
  // Popup,
  // Segment,
  Table,
  // Tab,
} from "semantic-ui-react";

import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

import PageHeader from "../../components/PageHeader";
import AddButton from "../../components/AddButton";
import TableActionButton from "../../components/TableActionButton";

const numLetters = 12; // Letters in table nav

//=======================================
//					ARTIST: LIST VIEW
//=======================================
class ArtistList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      artists: [],
      breadcrumbs_1: "",
      instructions: "",

      // Letter scrolling mechanism.
      all_letters: [],
      current_letter: props.activeLetter ? props.activeLetter : "a",
      current_letters: [],
      cl_slice_start: 27,
      cl_slice_end: 27 + numLetters,
    };

    this.deleteArtist = this.deleteArtist.bind(this);
    this.filterArtists = this.filterArtists.bind(this);
    this.letterForward = this.letterForward.bind(this);
    this.letterBackward = this.letterBackward.bind(this);
  }

  componentDidMount() {
    axios
      .post(config.get("api_url") + "artists/load", { letter: this.state.current_letter })
      .then((res) => {
        let spreadLetters = [...res.data.letters, ...res.data.letters, ...res.data.letters];
        this.setState({
          artists: res.data.artists,
          all_letters: spreadLetters,
          breadcrumbs_1: res.data.breadcrumbs_1 ? res.data.breadcrumbs_1 : "",
          breadcrumbs_2: res.data.breadcrumbs_2 ? res.data.breadcrumbs_2 : "",
          current_letters: spreadLetters.slice(this.state.cl_slice_start, this.state.cl_slice_end),
        });
      });
  }

  // LETTER PAGINATION
  //-------------------
  letterForward(event) {
    let newStart, newEnd;
    this.setState(
      (prevState) => {
        newStart = prevState.cl_slice_start + 1;
        newEnd = prevState.cl_slice_end + 1;
        return {
          cl_slice_end: newEnd,
          cl_slice_start: newStart,
          current_letters: prevState.all_letters.slice(newStart, newEnd),
        };
      },
      () => {}
    );
  }

  letterBackward(event) {
    let newStart, newEnd;
    this.setState(
      (prevState) => {
        newStart = prevState.cl_slice_start - 1;
        newEnd = prevState.cl_slice_end - 1;
        return {
          cl_slice_end: newEnd,
          cl_slice_start: newStart,
          current_letters: prevState.all_letters.slice(newStart, newEnd),
        };
      },
      () => {}
    );
  }

  // NEW DELETE (with custom return confirm)
  deleteArtist(artist_id, artist_name) {
    confirmAlert({
      title: "Deleting " + artist_name + "",
      message:
        "Really remove " +
        artist_name +
        " from Quantum Giant, including all associated albums and tracks?",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            const deleteUrl = config.get("api_url") + "artists/delete";
            const postData = {
              artist_id: artist_id,
            };
            axios.post(deleteUrl, postData).then((res) => {
              if (res.data.success >= 1) {
                window.location.reload();
              } else {
                alert(
                  "There was a problem deleting the artist. Please refresh the page and try again."
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

  // FILTER BY LETTER
  //------------------
  filterArtists(letter, e) {
    axios
      .post(config.get("api_url") + "artists/artists-by-letter", { letter: letter })
      .then((res) => {
        this.setState({
          artists: res.data.artists,
          current_letter: letter,
          breadcrumbs_2: letter,
        });
      });
  }

  render() {
    return (
      <div className='grid-x grid-margin-x'>
        {/* PAGE HEADER + BREADCRUMBS */}
        <PageHeader
          h1='Artists'
          link='/artists'
          iconName='users'
          breadcrumbs_1={this.state.breadcrumbs_1}
          breadcrumbs_2={this.state.breadcrumbs_2}
          instructions={this.state.instructions}
        />

        {/* ADD ARTIST */}
        <AddButton link='/artists/edit/add' text='Add New Artist' />

        {/* LIST OF ARTISTS */}
        <div className='cell small-12 table-scroll'>
          <Table celled striped compact size='small' unstackable>
            {/* TABLE HEADER & NAVIGATION */}
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Artist Name</Table.HeaderCell>
                <Table.HeaderCell collapsing style={{ textAlign: "left" }}>
                  Spins
                </Table.HeaderCell>
                <Table.HeaderCell collapsing style={{ textAlign: "left" }} colSpan={2}>
                  Metadata
                </Table.HeaderCell>
              </Table.Row>

              {/* Letters */}
              <Table.Row>
                <Table.HeaderCell textAlign='center' colSpan={4} id='artistsLetterMenu'>
                  <Menu compact secondary size='mini'>
                    <Menu.Item as='a' icon onClick={this.letterBackward}>
                      <Icon name='chevron left' />
                    </Menu.Item>
                    {this.state.current_letters.map((letter) => {
                      // More advanced solution...
                      // let aClass = this.state.current_letter === letter ? 'icon item active' : 'icon item';
                      // <Link className={aClass} to={'/artists/'+letter} key={letter}>{letter}
                      // </Link>
                      return (
                        <Menu.Item
                          active={this.state.current_letter === letter}
                          onClick={(e) => this.filterArtists(letter, e)}
                          style={{ textTransform: "uppercase" }}
                          key={letter}
                          as='a'
                        >
                          {letter}
                        </Menu.Item>
                      );
                    })}
                    <Menu.Item as='a' icon onClick={this.letterForward}>
                      <Icon name='chevron right' />
                    </Menu.Item>
                  </Menu>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            {/* TABLE BODY */}
            <Table.Body>
              {this.state.artists.map((artist) => {
                const artistId = artist["artist_id"];
                const artistHref = "/artists/edit/" + artistId;
                const albumHref = "/albums/artist/" + artistId;
                const trackHref = "/tracks/artist/" + artistId;
                return (
                  <Table.Row key={artistId}>
                    <Table.Cell>{artist["artist_name"]}</Table.Cell>
                    <Table.Cell collapsing>
                      <Button.Group basic size='small'>
                        <TableActionButton
                          link={"/summary/artist?artist_id=" + artistId}
                          actionName='View Artist Summary'
                          actionIcon='chart pie'
                        />
                        {/* <TableActionButton link={ '/spins?artist_id='+artistId } actionName='View Spins' actionIcon='headphones' /> */}
                        {/* <TableActionButton link={ '/search?album_id='+artistId } actionName='Search For This Artist' actionIcon='search' /> */}
                      </Button.Group>
                    </Table.Cell>
                    <Table.Cell collapsing>
                      <Button.Group basic size='small'>
                        <TableActionButton
                          link={albumHref}
                          actionName={"View Albums by " + artist["artist_name"]}
                          actionIcon='clone'
                        />
                        <TableActionButton
                          link={trackHref}
                          actionName={"View All Tracks by " + artist["artist_name"]}
                          actionIcon='list'
                        />
                      </Button.Group>
                    </Table.Cell>
                    <Table.Cell collapsing>
                      <Button.Group basic size='small'>
                        <TableActionButton
                          link={artistHref}
                          actionName='Edit Artist'
                          actionIcon='edit'
                        />
                        <TableActionButton
                          link={false}
                          actionName={"Delete Artist"}
                          actionIcon='trash'
                          onClick={() => {
                            this.deleteArtist(artist["artist_id"], artist["artist_name"]);
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
    );
  }
}

export default ArtistList;
