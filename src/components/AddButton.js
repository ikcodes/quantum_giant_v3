import React from 'react';
import './css/AddButton.css';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react';

export default function AddButton(props){
	return(
		<div className="cell shrink">
			<Link className="AddButton" to={ props.link }>
				<Button style={{marginBottom: "15px",}} circular size='mini' icon='plus'></Button>
				<p className="AddButtonText">{ props.text }</p>
			</Link>
		</div>
	)
}