import React from "react";
// Nested Routing: https://reacttraining.com/react-router/web/guides/quick-start
import {
  Switch,
  Route,
  // Link,
	useRouteMatch,
	useLocation
} from "react-router-dom";

import { Segment } from 'semantic-ui-react';

import AlbumEdit from '../views/album/AlbumEdit';
import AlbumList from '../views/album/AlbumList';

//=======================================
//				ALBUM PAGE & ROUTING
//=======================================
function AlbumPage(){
	
	let query = useQuery();	// Harness query strings
	let match = useRouteMatch(); 	// {[0]=albums} / {[1]=view} / [2]=albumId
	let urlChunks = useLocation().pathname.split('/'); if(urlChunks[0] === ''){ urlChunks.shift(); }
	
	//---------------------
	// AVAILABLE ACTIONS:
	//---------------------
	
	//	albums/edit/{album_id}
	let albumId = urlChunks[1] === 'edit' ? parseInt(urlChunks[2]) : null;
	
	// albums/edit/add
	let add = urlChunks[2] === 'add' ? true : false;
	
	//	albums/artist/{artist_id}
	let artistFilter = urlChunks[1] === 'artist' ? parseInt(urlChunks[2]) : null;
	
	// 	albums/{letter}
	let letterFilter = ( urlChunks[1] !== 'artist' && urlChunks[1] !== 'label' && urlChunks[1] !== '0' ) ? urlChunks[1] : null;
	
	// albums/label/{label_id}
	let labelFilter = urlChunks[1] === 'label' || (urlChunks[1] === 'label' && urlChunks[2] === '0' ) ? parseInt(urlChunks[2]) : null;
	
	return(
		<Switch>
			<Route path={`${match.path}/edit`}>
				{/* <Segment id="albumEdit" className="page grid-container"> */}
				<Segment id="albumEdit" className="page">
					<AlbumEdit
						add={ add }
						albumId={ albumId }
						artistId={ query.get("artist_id") }
					/>
				</Segment>
			</Route>
			<Route path={`${match.path}/:letter?`}>
				{/* <Segment id="albumView" className="page grid-container"> */}
				<Segment id="albumView" className="page">
					<AlbumList 
						activeLetter={ letterFilter }
						activeArtist={ artistFilter }
						activeLabel={ labelFilter }
					/>
				</Segment>
			</Route>
		</Switch>
	)
}

function useQuery(){
	return new URLSearchParams(useLocation().search);
}

export default AlbumPage;