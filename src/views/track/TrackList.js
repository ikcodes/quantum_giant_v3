import React from "react";
import axios from "axios";
import config from "react-global-configuration";
import { Button, Icon, Menu, Table } from "semantic-ui-react";
import AddButton from "../../components/AddButton";
import ViewSummaryButton from "../../components/ViewSummaryButton";
import PageHeader from "../../components/PageHeader";
import TableBodyLoader from "../../components/TableBodyLoader";
import TableActionButton from "../../components/TableActionButton";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
const numLetters = 12; // Letters in table nav

class TrackList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tracks: [], // POST to /tracks/load/ ( postData in componentDidMount )
      current_album: props.activeAlbum ? props.activeAlbum : null,
      current_artist: props.activeArtist ? props.activeArtist : null,

      breadcrumbs_1: "",
      breadcrumbs_2: "",
      instructions: "",

      all_letters: [],
      current_letters: [],
      current_letter: props.activeLetter ? props.activeLetter : "a",
      cl_slice_start: 27,
      cl_slice_end: 27 + numLetters,

      loading: true,
    };
    this.deleteTrack = this.deleteTrack.bind(this);
    this.filterTracks = this.filterTracks.bind(this);
    this.letterForward = this.letterForward.bind(this);
    this.letterBackward = this.letterBackward.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    window.location.reload();
  }

  componentDidMount() {
    // What view to load? ( Album, Artist, or Letter )

    let postData = {};
    // let bc1 = "All Tracks";
    // let bc2 = "A-Z";
    if (this.state.current_album) {
      postData["album_id"] = this.state.current_album;
    } else if (this.state.current_artist) {
      postData["artist_id"] = this.state.current_artist;
    } else {
      postData["letter"] = this.state.current_letter;
    }
    axios.post(config.get("api_url") + "tracks/load", postData).then((res) => {
      let spreadLetters = res.data.letters
        ? [...res.data.letters, ...res.data.letters, ...res.data.letters]
        : [];
      this.setState({
        loading: false,
        tracks: res.data.tracks,

        all_letters: spreadLetters,
        current_letters: res.data.letters
          ? spreadLetters.slice(this.state.cl_slice_start, this.state.cl_slice_end)
          : [],

        breadcrumbs_1: res.data.breadcrumbs_1 ? res.data.breadcrumbs_1 : this.state.breadcrumbs_1,
        breadcrumbs_2: res.data.breadcrumbs_2 ? res.data.breadcrumbs_2 : this.state.breadcrumbs_2,
      });
    });
  }

  deleteTrack(track_gid, track_title) {
    confirmAlert({
      title: "Deleting " + track_title + "",
      message: "Really remove " + track_title + " from Quantum Giant?",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            const deleteUrl = config.get("api_url") + "tracks/delete";
            const postData = {
              track_gid: track_gid,
            };
            axios.post(deleteUrl, postData).then((res) => {
              if (res.data.success >= 1) {
                window.location.reload();
              } else {
                alert(
                  "There was a problem deleting the track. Please refresh the page and try again."
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

  // LETTER PAGINATION
  //-------------------
  letterForward(event) {
    let newStart, newEnd;
    this.setState((prevState) => {
      newStart = prevState.cl_slice_start + 1;
      newEnd = prevState.cl_slice_end + 1;
      return {
        cl_slice_end: newEnd,
        cl_slice_start: newStart,
        current_letters: prevState.all_letters.slice(newStart, newEnd),
      };
    });
  }

  letterBackward(event) {
    let newStart, newEnd;
    this.setState((prevState) => {
      newStart = prevState.cl_slice_start - 1;
      newEnd = prevState.cl_slice_end - 1;
      return {
        cl_slice_end: newEnd,
        cl_slice_start: newStart,
        current_letters: prevState.all_letters.slice(newStart, newEnd),
      };
    });
  }

  // FILTER BY LETTER
  //------------------
  filterTracks(letter, e) {
    this.setState(
      {
        current_letter: letter,
        loading: true,
        tracks: [],
      },
      () => {
        axios.post(config.get("api_url") + "tracks/load", { letter: letter }).then((res) => {
          this.setState({
            tracks: res.data.tracks,
            breadcrumbs_1: "All Tracks (A-Z)",
            breadcrumbs_2: letter,
            loading: false,
          });
        });
      }
    );
  }

  render() {
    let addTrackHref = "/tracks/edit/add";
    if (this.state.current_album) {
      addTrackHref += "?album_id=" + this.state.current_album;
    }
    if (this.state.current_artist) {
      addTrackHref += "?artist_id=" + this.state.current_artist;
    }

    let viewSummaryText = null;
    let viewSummaryHref = null;
    let editAlbumText = null;
    let editAlbumHref = null;
    if (this.state.current_album) {
      viewSummaryHref = "/summary/album?album_id=" + this.state.current_album;
      viewSummaryText = "View Album Summary";
      editAlbumHref = "/albums/edit/" + this.state.current_album;
      editAlbumText = "Edit Album";
    }
    if (this.state.current_artist) {
      viewSummaryHref = "/summary/artist?artist_id=" + this.state.current_artist;
      viewSummaryText = "View Artist Summary";
    }

    let hideNav = this.state.current_album || this.state.current_artist;

    return (
      <div className='grid-x grid-margin-x'>
        {/* PAGE HEADER + BREADCRUMBS */}
        <PageHeader
          h1='Tracks'
          link='/tracks'
          iconName='list'
          breadcrumbs_1={this.state.breadcrumbs_1}
          breadcrumbs_2={this.state.breadcrumbs_2}
          instructions={this.state.instructions}
        />

        {/* ADD ALBUM */}
        <AddButton link={addTrackHref} text='Add New Track' />

        {/* VIEW *EITHER* SUMMARY */}
        <ViewSummaryButton link={viewSummaryHref} text={viewSummaryText} />

        <ViewSummaryButton
          icon='edit'
          style={editAlbumText && editAlbumHref ? {} : { display: "none" }}
          link={editAlbumHref}
          text={editAlbumText}
        />

        {/* LIST ALBUMS */}
        <div className='cell small-12 table-scroll'>
          <Table celled compact striped size='small' unstackable>
            {/* TABLE HEADER & NAVIGATION */}
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell collapsing style={hideNav ? {} : { display: "none" }}>
                  #
                </Table.HeaderCell>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Artist</Table.HeaderCell>
                <Table.HeaderCell>Album</Table.HeaderCell>
                <Table.HeaderCell>Spins</Table.HeaderCell>
                <Table.HeaderCell colSpan={2}>Metadata</Table.HeaderCell>
              </Table.Row>
              <Table.Row style={hideNav ? { display: "none" } : {}}>
                <Table.HeaderCell
                  textAlign='center'
                  colSpan={hideNav ? "6" : "5"}
                  id='artistsLetterMenu'
                >
                  <Menu compact secondary size='mini'>
                    <Menu.Item as='a' icon onClick={this.letterBackward}>
                      <Icon name='chevron left' />
                    </Menu.Item>
                    {this.state.current_letters.map((letter) => {
                      return (
                        <Menu.Item
                          active={this.state.current_letter === letter}
                          onClick={(e) => this.filterTracks(letter, e)}
                          key={letter}
                          style={{ textTransform: "uppercase" }}
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
              <TableBodyLoader
                loading={this.state.loading}
                slow={false}
                cols={6}
                message='Loading Tracks...'
              />

              {this.state.tracks.map((track) => {
                // ACTIONS: Edit Track, View Tracks on Album, View Tracks by Artist
                // const spinHref = '/spins?track_gid='+track['track_gid'];
                // const searchHref = '/search?track_gid='+track['track_gid'];
                const editHref = "/tracks/edit/" + track["track_gid"];
                const albumHref = "/tracks/album/" + track["album_id"];
                const artistHref = "/tracks/artist/" + track["artist_id"];
                const albumAction = "View Tracks on " + track["album_title"];
                const artistAction = "View All Tracks by " + track["artist_name"];

                let rightsMarkup;
                if (this.props.activeAlbum) {
                  rightsMarkup = (
                    <Button.Group basic size='small'>
                      <TableActionButton
                        link={artistHref}
                        actionName={artistAction}
                        actionIcon='user'
                      />
                    </Button.Group>
                  );
                } else if (this.props.activeArtist) {
                  rightsMarkup = (
                    <Button.Group basic size='small'>
                      <TableActionButton
                        link={albumHref}
                        actionName={albumAction}
                        actionIcon='clone'
                      />
                    </Button.Group>
                  );
                } else {
                  rightsMarkup = (
                    <Button.Group basic size='small'>
                      <TableActionButton
                        link={albumHref}
                        actionName={albumAction}
                        actionIcon='clone'
                      />
                      <TableActionButton
                        link={artistHref}
                        actionName={artistAction}
                        actionIcon='user'
                      />
                    </Button.Group>
                  );
                }

                return (
                  <Table.Row key={track["track_gid"]}>
                    <Table.Cell style={hideNav ? {} : { display: "none" }} collapsing>
                      {track["track_num"] || ""}
                    </Table.Cell>
                    <Table.Cell>{track["track_title"] || ""}</Table.Cell>
                    <Table.Cell>{track["artist_name"] || ""}</Table.Cell>
                    <Table.Cell>{track["album_title"] || ""}</Table.Cell>
                    <Table.Cell collapsing>
                      <Button.Group basic size='small'>
                        <TableActionButton
                          link={"/summary/track?track_gid=" + track["track_gid"]}
                          actionName='View Track Summary'
                          actionIcon='chart pie'
                        />
                      </Button.Group>
                    </Table.Cell>
                    <Table.Cell>{rightsMarkup}</Table.Cell>
                    <Table.Cell>
                      <Button.Group basic size='small'>
                        <TableActionButton
                          link={editHref}
                          actionName='Edit Track'
                          actionIcon='edit'
                        />
                        <TableActionButton
                          link={false}
                          actionName={"Delete Track"}
                          actionIcon='trash'
                          onClick={() => {
                            this.deleteTrack(track["track_gid"], track["track_title"]);
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

export default TrackList;
