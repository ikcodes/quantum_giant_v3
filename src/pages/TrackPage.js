import React from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom"; // Nested Routing: https://reacttraining.com/react-router/web/guides/quick-start
import { Segment } from "semantic-ui-react";
import TrackEdit from "../views/track/TrackEdit";
import TrackList from "../views/track/TrackList";

//=======================================
//				TRACK PAGE & ROUTING
//=======================================
function TrackPage() {
  let query = useQuery(); // Harness query strings
  let match = useRouteMatch(); // Match with current route.
  let urlChunks = useLocation().pathname.split("/");
  if (urlChunks[0] === "") {
    urlChunks.shift();
  }

  //---------------------
  // AVAILABLE ACTIONS:
  //---------------------

  //	tracks/edit/{id}
  let trackId = urlChunks[1] === "edit" ? parseInt(urlChunks[2]) : null;

  //	tracks/edit/add
  let add = urlChunks[2] === "add" ? true : false;

  //	tracks/album/{album_id}
  let albumFilter = urlChunks[1] === "album" ? parseInt(urlChunks[2]) : null;

  //	tracks/artist/{artist_id}
  let artistFilter = urlChunks[1] === "artist" ? parseInt(urlChunks[2]) : null;

  // 	tracks/{letter}
  let letterFilter = urlChunks[1] !== "artist" && urlChunks[1] !== "album" ? urlChunks[1] : null;

  return (
    <Switch>
      <Route path={`${match.path}/edit`}>
        <Segment id='trackEdit' className='page'>
          <TrackEdit
            add={add}
            track_gid={trackId}
            album_id={query.get("album_id")}
            artist_id={query.get("artist_id")}
          />
        </Segment>
      </Route>
      <Route path={`${match.path}/album`}>
        <Segment id='trackView' className='page'>
          <TrackList activeAlbum={albumFilter} />
        </Segment>
      </Route>
      <Route path={`${match.path}/artist`}>
        <Segment id='trackView' className='page'>
          <TrackList activeArtist={artistFilter} />
        </Segment>
      </Route>
      <Route path={`${match.path}`}>
        <Segment id='trackView' className='page'>
          <TrackList activeLetter={letterFilter} />
        </Segment>
      </Route>
    </Switch>
  );
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default TrackPage;
