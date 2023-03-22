import React from "react";

// Nested Routing: https://reacttraining.com/react-router/web/guides/quick-start
import {
  Switch,
  Route,
  // Link,
	useRouteMatch,
	useLocation,
} from "react-router-dom";
import { Segment } from 'semantic-ui-react'

import ArtistEdit from '../views/artist/ArtistEdit';
import ArtistList from '../views/artist/ArtistList';

//=======================================
//				ARTIST PAGE & ROUTING
//=======================================
function ArtistPage(){
	
	let match = useRouteMatch(); 	// {[0]=artists} / {[1]=view} / [2]=artistId
	let urlChunks = useLocation().pathname.split('/'); if(urlChunks[0] === ''){ urlChunks.shift(); }
	
	//---------------------
	// AVAILABLE ACTIONS:
	//---------------------
	
	// artists/edit/{artist_id}
	let artistId = urlChunks[1] === 'edit' ? parseInt(urlChunks[2]) : null;
	
	// artists/edit/add
	let add = urlChunks[2] === 'add' ? true : false;
	
	// artists/{letter}
	let currLetter = urlChunks[1] !== 'edit' ? urlChunks[1] : null;
	
	return(
		<Switch>
			<Route path={`${match.path}/edit`}>
				{/* <Segment id="artistEdit" className="page grid-container"> */}
				<Segment id="artistEdit" className="page">
					<ArtistEdit 
						add={ add } 
						artistId={ artistId } 
						/>
				</Segment>
			</Route>
			<Route path={`${match.path}/:letter?`}>
				{/* <Segment id="artistView" className="page grid-container"> */}
				<Segment id="artistView" className="page">
					<ArtistList
						activeLetter={ currLetter }
						/>
				</Segment>
			</Route>
		</Switch>
	)
}

export default ArtistPage;