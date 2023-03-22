import React from 'react';
import { 
	Link, 
	// useLocation, 
	// useHistory
} from 'react-router-dom';
import { Popup, Button } from 'semantic-ui-react';

export default function TableActionButton(props){
	
	// let history = useHistory();
	// let location = useLocation();
	
	if(props.link === false){
		return(
			// React will bitch if you remove the href=/. onClick should always override it.
			<div onClick={props.onClick}>
				<Popup 
					content={ props.actionName } 
					offset='0, 1px' 
					position='left center' 
					trigger={
						<Button className={ props.buttonClass } circular icon={ props.actionIcon } size='mini'/>
					}
					/>
			</div>
		)
	}else{
		// console.log(props.link);	/// HERE => WHY DOESN'T THIS ENCODE
		return(
			<Link to={ props.link }>
				<Popup 
					content={ props.actionName } 
					offset='0, 1px' 
					position='left center' 
					trigger={
						<Button className={ props.buttonClass } circular icon={ props.actionIcon } size='mini'/>
					}
				/>
			</Link>
		)
	}
}