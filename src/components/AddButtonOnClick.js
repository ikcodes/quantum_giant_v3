import React from 'react';
import './css/AddButton.css';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react';

// THIS COMPONENT IS CURRENTLY USELESS!! 

export default function AddButtonOnClick(props){
	return(
		<div className="cell small-12">
			<a>
				<Button onClick={ props.onClick } style={{marginBottom: "15px",}} circular size='mini' icon='plus'></Button>
				<p className="AddButtonText">{ props.text }</p>
			</a>
		</div>
	)
}