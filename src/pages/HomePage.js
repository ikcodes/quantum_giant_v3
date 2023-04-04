import React from "react";
import axios from "axios";
import config from "react-global-configuration";
// Nested Routing: https://reacttraining.com/react-router/web/guides/quick-start

import { Segment, Button, Icon, Table } from "semantic-ui-react";

// import Select from 'react-select-virtualized'
import PageHeader from "../components/PageHeader";
import FeatureList from "../components/FeatureList";
import TableActionButton from "../components/TableActionButton";
import "./css/HomePage.css";

class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      albums: [],
      albums_recent: [],
      albums_upcoming: [],
    };
  }

  componentDidMount() {
    axios.get(config.get("api_url") + "albums/load_homepage").then((res) => {
      if (res.data.albums || res.data.albums_upcoming) {
        this.setState(
          {
            albums: res.data.albums,
            albums_upcoming: res.data.albums_upcoming,
          },
          () => {
            axios.get(config.get("api_url") + "albums/load_outstanding").then((res) => {
              if (res.data.albums_recent) {
                this.setState({
                  albums_recent: res.data.albums_recent,
                });
              }
            });
          }
        );
      } else {
        console.log("PROBLEM with incoming album data!");
        console.log(res.data);
      }
    });
  }

  render() {
    return (
      <Segment id='HomePage' className='page'>
        <div className='grid-x grid-margin-x'>
          <PageHeader h1='Home' link='/' iconName='home' instructions='Welcome to Quantum Giant!' />

          <FeatureList />

          {/* ================ */}
          {/* CURRENT RELEASES */}
          {/* ================ */}
          <div className='grid-x grid-margin-x grid-padding-x'>
            <div className='cell small-12' style={{ marginBottom: "30px" }}>
              <div className='pageHeader'>
                <h1 style={{ letterSpacing: "-1px" }}>
                  <Icon className='pageIcon' name='clone'></Icon>Current Releases
                </h1>
                <p className='instructions'>
                  Albums with a release date in the past 3 months. Included in marketing reports.
                </p>
              </div>
              <div className='grid-x'>
                <div className='cell small-12 table-scroll'>
                  <Table celled compact striped size='small' unstackable>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Album</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Artist</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Release</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Label</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }} collapsing>
                          Spins
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }} collapsing colSpan={2}>
                          Metadata
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {this.state.albums.map((album) => {
                        const albumId = album["album_id"];
                        const albumHref = "/albums/edit/" + albumId;
                        const trackHref = "/tracks/album/" + albumId;
                        var artistHref = "/artists/";
                        var artistName =
                          album["artist"] === null || album["artist"] === undefined
                            ? "NULL"
                            : album["artist"]["artist_name"];
                        if (
                          album &&
                          album["album_is_compilation"] !== undefined &&
                          (album["artist"]["artist_id"] !== undefined ||
                            album["artist"]["artist_id"] === null)
                        ) {
                          artistHref =
                            parseInt(album["album_is_compilation"]) === 1
                              ? "/artists/"
                              : "/artists/edit/" + album["artist"]["artist_id"];
                        }
                        return (
                          <Table.Row key={album["album_id"]}>
                            <Table.Cell>{album["album_title"]}</Table.Cell>
                            <Table.Cell>{artistName}</Table.Cell>
                            <Table.Cell>{album["album_release_date"]}</Table.Cell>
                            <Table.Cell>{album["label_name"]}</Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={"/summary/album?album_id=" + albumId}
                                  actionName='View Album Summary'
                                  actionIcon='chart pie'
                                />
                              </Button.Group>
                            </Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={trackHref}
                                  actionName={'View All Tracks on "' + album["album_title"] + '"'}
                                  actionIcon='list'
                                />
                                <TableActionButton
                                  link={artistHref}
                                  actionName={
                                    "View artist details for " + album["artist"]["artist_name"]
                                  }
                                  actionIcon='user'
                                />
                              </Button.Group>
                            </Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={albumHref}
                                  actionName='Edit Album'
                                  actionIcon='edit'
                                />
                                <TableActionButton
                                  link={false}
                                  actionName={"Delete Album"}
                                  actionIcon='trash'
                                  onClick={() => {
                                    this.deleteAlbum(album["album_id"], album["album_title"]);
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
            </div>

            {/* ================= */}
            {/* UPCOMING RELEASES */}
            {/* ================= */}
            <div className='cell small-12' style={{ marginBottom: "30px" }}>
              <div className='pageHeader'>
                <h1 style={{ letterSpacing: "-1px" }}>
                  <Icon className='pageIcon' name='clone'></Icon>Upcoming Releases
                </h1>
                <p className='instructions'>Albums that are soon planned for release.</p>
              </div>
              <div className='grid-x'>
                <div className='cell small-12 table-scroll'>
                  <Table celled compact striped size='small' unstackable>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Album</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Artist</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Release</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Label</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }} collapsing>
                          Spins
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }} collapsing colSpan={2}>
                          Metadata
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {this.state.albums_upcoming.map((album) => {
                        const albumId = album["album_id"];
                        const albumHref = "/albums/edit/" + albumId;
                        const trackHref = "/tracks/album/" + albumId;
                        var artistHref = "/artists/";
                        var artistName =
                          album["artist"] === null || album["artist"] === undefined
                            ? "NULL"
                            : album["artist"]["artist_name"];
                        if (
                          album &&
                          album["album_is_compilation"] !== undefined &&
                          (album["artist"]["artist_id"] !== undefined ||
                            album["artist"]["artist_id"] === null)
                        ) {
                          artistHref =
                            parseInt(album["album_is_compilation"]) === 1
                              ? "/artists/"
                              : "/artists/edit/" + album["artist"]["artist_id"];
                        }
                        return (
                          <Table.Row key={album["album_id"]}>
                            <Table.Cell>{album["album_title"]}</Table.Cell>
                            <Table.Cell>{artistName}</Table.Cell>
                            <Table.Cell>{album["album_release_date"]}</Table.Cell>
                            <Table.Cell>{album["label_name"]}</Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={"/summary/album?album_id=" + albumId}
                                  actionName='View Album Summary'
                                  actionIcon='chart pie'
                                />
                              </Button.Group>
                            </Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={trackHref}
                                  actionName={'View All Tracks on "' + album["album_title"] + '"'}
                                  actionIcon='list'
                                />
                                <TableActionButton
                                  link={artistHref}
                                  actionName={
                                    "View artist details for " + album["artist"]["artist_name"]
                                  }
                                  actionIcon='user'
                                />
                              </Button.Group>
                            </Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={albumHref}
                                  actionName='Edit Album'
                                  actionIcon='edit'
                                />
                                <TableActionButton
                                  link={false}
                                  actionName={"Delete Album"}
                                  actionIcon='trash'
                                  onClick={() => {
                                    this.deleteAlbum(album["album_id"], album["album_title"]);
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
            </div>

            {/* ========================== */}
            {/* RECENTLY UPLOADED RELEASES */}
            {/* ========================== */}
            <div className='cell small-12' style={{ marginBottom: "30px" }}>
              <div className='pageHeader'>
                <h1 style={{ letterSpacing: "-1px" }}>
                  <Icon className='pageIcon' name='clone'></Icon>Albums Missing Data
                </h1>
                <p className='instructions'>
                  These albums are missing a proper release date or are unassigned to a label.{" "}
                  <br />
                  To get the most out of the app, please update any albums you see here with the
                  correct release date or label imprint.
                </p>
              </div>
              <div className='grid-x'>
                <div className='cell small-12 table-scroll'>
                  <Table celled compact striped size='small' unstackable>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Album</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Artist</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Release</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }}>Label</Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }} collapsing>
                          Spins
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ textAlign: "left" }} collapsing colSpan={2}>
                          Metadata
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {this.state.albums_recent.map((album) => {
                        const albumId = album["album_id"];
                        const albumHref = "/albums/edit/" + albumId;
                        const trackHref = "/tracks/album/" + albumId;
                        var artistHref = "/artists/";
                        var artistName =
                          album["artist"] === null || album["artist"] === undefined
                            ? "NULL"
                            : album["artist"]["artist_name"];
                        if (
                          album &&
                          album["album_is_compilation"] !== undefined &&
                          (album["artist"]["artist_id"] !== undefined ||
                            album["artist"]["artist_id"] === null)
                        ) {
                          artistHref =
                            parseInt(album["album_is_compilation"]) === 1
                              ? "/artists/"
                              : "/artists/edit/" + album["artist"]["artist_id"];
                        }
                        return (
                          <Table.Row key={album["album_id"]}>
                            <Table.Cell>{album["album_title"]}</Table.Cell>
                            <Table.Cell>{artistName}</Table.Cell>
                            <Table.Cell>{album["album_release_date"]}</Table.Cell>
                            <Table.Cell>{album["label_name"]}</Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={"/summary/album?album_id=" + albumId}
                                  actionName='View Album Summary'
                                  actionIcon='chart pie'
                                />
                              </Button.Group>
                            </Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={trackHref}
                                  actionName={'View All Tracks on "' + album["album_title"] + '"'}
                                  actionIcon='list'
                                />
                                <TableActionButton
                                  link={artistHref}
                                  actionName={
                                    "View artist details for " + album["artist"]["artist_name"]
                                  }
                                  actionIcon='user'
                                />
                              </Button.Group>
                            </Table.Cell>
                            <Table.Cell collapsing>
                              <Button.Group basic size='small'>
                                <TableActionButton
                                  link={albumHref}
                                  actionName='Edit Album'
                                  actionIcon='edit'
                                />
                                <TableActionButton
                                  link={false}
                                  actionName={"Delete Album"}
                                  actionIcon='trash'
                                  onClick={() => {
                                    this.deleteAlbum(album["album_id"], album["album_title"]);
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
            </div>

            {/* ==================================== */}
            {/* ======={ PAGE BOTTOM LINKS }======== */}
            {/* ==================================== */}
            <FeatureList />
          </div>
        </div>
      </Segment>
    );
  }
}
export default HomePage;
