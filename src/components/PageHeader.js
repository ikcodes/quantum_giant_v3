import React from 'react';
import { Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import './css/PageHeader.css';

export default function PageHeader(props){
	return(
		<div className="cell small-12">
			<div className="pageHeader">
				<Link to={ props.link }>
					<h1><Icon className="pageIcon" name={ props.iconName }></Icon>{ props.h1 }</h1>
				</Link>
				<ul id="breadcrumbs">
					<li className="gold" >{ props.breadcrumbs_1 ? '>' : '' }</li>
					{/* <li className="slate">{ props.breadcrumbs_1 ? props.breadcrumbs_1 : "" }</li> */}
					<li className="slate"><a href={ props.breadcrumbs_1_url ? props.breadcrumbs_1_url : "" }>{ props.breadcrumbs_1 ? props.breadcrumbs_1 : "" }</a></li>
					<li className="gold" >{ props.breadcrumbs_2 ? '>' : '' }</li>
					{/* <li className="slate">{ props.breadcrumbs_2 ? props.breadcrumbs_2 : "" }</li> */}
					<li className="slate"><a href={ props.breadcrumbs_2_url ? props.breadcrumbs_2_url : "" }>{ props.breadcrumbs_2 ? props.breadcrumbs_2 : "" }</a></li>
				</ul>
				<hr />
				<p className="instructions">{ props.instructions }</p>
			</div>
		</div>
	)
}