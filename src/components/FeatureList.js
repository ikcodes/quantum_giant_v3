import React from 'react';
import { Link } from 'react-router-dom';
import { 
	Segment,
	Icon,
} from 'semantic-ui-react'

export default function FeatureList(){
	return(
		<div className='cell small-12'>
			<div className='grid-x grid-margin-x'>
				<div className="cell medium-12 large-auto">
					<Link to="/label">
						<Segment style={{marginBottom: '30px'}}>
							<div className="pageHeader">
								<h2><Icon className="pageIcon" name="ticket"></Icon>Labels</h2>
								<p><strong>View label-by-label spin summaries.</strong></p>
							</div>
						</Segment>
					</Link>
				</div>
				<div className="cell medium-12 large-auto">
					<Link to="/spin-summary">
						<Segment style={{marginBottom: '30px'}}>
							<div className="pageHeader">
								<h2><Icon className="pageIcon" name="headphones"></Icon>Spins</h2>
								<p><strong>View top spinning artists by channel.</strong></p>
							</div>
						</Segment>
					</Link>
				</div>
				<div className="cell medium-12 large-auto">
					<Link to="/albums">
						<Segment style={{marginBottom: '30px'}}>
							<div className="pageHeader">
								<h2><Icon className="pageIcon" name="clone"></Icon>Albums</h2>
								<p><strong>View and edit albums.</strong></p>
							</div>
						</Segment>
					</Link>
				</div>
				<div className="cell medium-12 large-auto">
					<Link to="/artists">
						<Segment style={{marginBottom: '30px'}}>
							<div className="pageHeader">
								<h2><Icon className="pageIcon" name="user"></Icon>Artists</h2>
								<p><strong>View and edit artists.</strong></p>
							</div>
						</Segment>
					</Link>
				</div>
				<div className="cell medium-12 large-auto">
					<Link to="/search">
						<Segment style={{marginBottom: '30px'}}>
							<div className="pageHeader">
								<h2><Icon className="pageIcon" name="search"></Icon>Search</h2>
								<p><strong>Search the entire data warehouse.</strong></p>
							</div>
						</Segment>
					</Link>
				</div>
			</div>
		</div>
	)
}