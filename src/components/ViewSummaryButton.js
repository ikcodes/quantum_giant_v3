import React from 'react';
import './css/AddButton.css';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react';

export default function ViewSummaryButton(props){
	
	// let style;
	// if(props.style){
	// 	style = { ...props.style, marginBottom: "15px"}
	// }else{
	// 	style = { backgroundColor: "#f0f", marginBottom: "15px" }
	// }
	
	var style={marginBottom: "15px"}
	
	var markup = ""
	if(props.link && props.text){
		markup = (
			<div className="cell shrink">
				<Link className="AddButton" to={ props.link }>
					<Button style={style} circular size='mini' icon={ props.icon || 'chart pie' }></Button>
					<p className="AddButtonText">{ props.text }</p>
				</Link>
			</div>
		)
	}
	
	return markup
}