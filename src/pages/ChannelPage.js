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

import ChannelEdit from '../views/channel/ChannelEdit';
import ChannelList from '../views/channel/ChannelList';

//=======================================
//				ARTIST PAGE & ROUTING
//=======================================
function ChannelPage(){
	
	let match = useRouteMatch(); 	// {[0]=channels} / {[1]=view} / [2]=channelNumber
	let urlChunks = useLocation().pathname.split('/'); if(urlChunks[0] === ''){ urlChunks.shift(); }
	
	//---------------------
	// AVAILABLE ACTIONS:
	//---------------------
	
	// channels/edit/{channel_id}
	let channelNumber = urlChunks[1] === 'edit' ? parseInt(urlChunks[2]) : null;
	
	// channels/edit/add
	let add = urlChunks[2] === 'add' ? true : false;
	
	// channels/{letter}
	let currLetter = urlChunks[1] !== 'edit' ? urlChunks[1] : null;
	
	return(
		<Switch>
			<Route path={`${match.path}/edit`}>
				<Segment id="channelEdit" className="page">
					<ChannelEdit 
						add={ add } 
						channelNumber={ channelNumber } 
						/>
				</Segment>
			</Route>
			<Route path={`${match.path}/:letter?`}>
				<Segment id="channelView" className="page">
					<ChannelList
						activeLetter={ currLetter }
						/>
				</Segment>
			</Route>
		</Switch>
	)
}

export default ChannelPage;