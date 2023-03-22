import React from "react";
import './css/App.css';

// Nested Routing: https://reacttraining.com/react-router/web/guides/quick-start
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

// Function component that uses useLocation to set the active nav item.
import UserNav from '../global/UserNav';

import ArtistPage from '../pages/ArtistPage';
import AlbumPage from '../pages/AlbumPage';
import TrackPage from '../pages/TrackPage';
import LabelPage from '../pages/LabelPage';
import ChannelPage from '../pages/ChannelPage';
import SpinSummary from '../pages/SpinSummary';
import TopAlbums from '../pages/TopAlbums';
import TopSpinners from '../pages/TopSpinners';
import ArtistSummary from '../pages/SummaryArtist';
import AlbumSummary from '../pages/SummaryAlbum';
import TrackSummary from '../pages/SummaryTrack';
import LabelSummary from '../pages/SummaryLabel';
import SearchResults from '../pages/SearchResults';
import HomePage from '../pages/HomePage';
import Search from '../pages/Search';
import Upload from '../pages/Upload';
import Commercials from '../pages/Commercials';
import DanSummary from '../pages/Dan';

export default function App() {
  return (
    <Router>
      <UserNav />
      <div id="appWrap" className="App">
        <div id="appPadding">
          <Switch>
            {/* MAIN APP ROUTES */}
            {/* Adjust these in /src/pages */}
            {/* Each has a view in /src/views (default is List) */}
            <Route path="/artists" component={ArtistPage}></Route>
            <Route path="/albums" component={AlbumPage}></Route>
            <Route path="/tracks" component={TrackPage}></Route>
            <Route path="/channels" component={ChannelPage}></Route>
            <Route path="/search" component={Search}></Route>
            <Route path="/upload" component={Upload}></Route>
            <Route path="/commercials" component={Commercials}></Route>
            <Route path="/summary/artist" component={ArtistSummary}></Route>
            <Route path="/summary/album" component={AlbumSummary}></Route>
            <Route path="/summary/track" component={TrackSummary}></Route>
            <Route path="/summary/label" component={LabelSummary}></Route>
            <Route path="/label" component={LabelPage}></Route>
            <Route path="/spin-summary" component={SpinSummary}></Route>
            <Route path="/top-spinners" component={TopSpinners}></Route>
            <Route path="/top-albums" component={TopAlbums}></Route>
            <Route path="/spins" component={SearchResults}></Route>
            <Route path="/filemaker" component={DanSummary}></Route>
            <Route path="/" component={HomePage}></Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}