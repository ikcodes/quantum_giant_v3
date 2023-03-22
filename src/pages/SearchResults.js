import React from 'react';
import axios from 'axios';
import queryString from 'query-string';
import config from 'react-global-configuration';
import PageHeader from '../components/PageHeader';
import TableBodyLoader from '../components/TableBodyLoader';
import TableActionButton from '../components/TableActionButton';

import { 
	// Form,
	// Input,
	Button,
	Segment,
	Table,
	Menu,
	Icon,
	// Label,
	// Pagination
} from 'semantic-ui-react';
import { CSVLink } from "react-csv";
import {
	Link
} from 'react-router-dom';

class SearchResults extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			params: {},
			spins: [],
			spin_ct: 0,
			pagination: [],
			pages: 0,
			page: 1,
			loading: true,
			csvExport: [[]],
			exports_are_in: false,
		}
		this.spinPagination = this.spinPagination.bind(this);
		this.renderExportButton = this.renderExportButton.bind(this);
	}
	componentDidMount(){
		let queryValues = queryString.parse(decodeURI(this.props.location.search));
		
		// Disable artist name / track title if IDs are passed
		if(queryValues.artist_id){
			queryValues.artist_name = '';
		}
		if(queryValues.track_gid){
			queryValues.track_title = '';
		}
		
		this.setState({
			params: queryValues,
		}, () => {
				this.updateSpins()
			}
		);
	}
	
	updateSpins(){
		var params = this.state.params;
		params['get_csv'] = this.state.exports_are_in === false ? 1 : 0;
		axios.post(config.get('api_url') + 'spins/get-spins', params).then(res => {
			if(res.data.spins && res.data.spin_ct){
				// console.log('we have spins!');
				// console.log(res.data.spins);
				this.setState({
					spins: res.data.spins,
					spin_ct: res.data.spin_ct,
					pagination: res.data.pagination,
					pages: res.data.pages,
					page: 1,
					loading: false,
					no_spins: false,
				}, () => {
					if(res.data.csv){
						this.setState({
						csvExport: res.data.csv,
						exports_are_in: true,
						}, () => this.renderExportButton())
					}else{
						this.setState({
							csvExport: [[]],
							exports_are_in: false,
						})
					}
				});
			}else{
				this.setState({
					csvExport: [[]],
					get_csv: true,
					spins: [],
					no_spins: true,
					loading: false,
					spin_ct: 0,
					pages: 0,
					pagination: [],
				}, () => this.renderExportButton())
			}
		})
	}
	
	spinPagination(pageNum){
		let params = this.state.params;
		params['page'] = pageNum;
		params['get_csv'] = false;
		this.setState({
			loading: true,
			spins: [],
			page: pageNum,
		});
		axios.post(config.get('api_url') + 'spins/get-spins', params).then(res => {
			this.setState({
				loading: false,
				spins: res.data.spins ? res.data.spins : [],
			})
		})
	}
	
	renderExportButton(){
		if(this.state.csvExport.length > 1){	// Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
			return (
				<CSVLink data={this.state.csvExport}>
					<Button style={{height: 40}} primary>
						<Icon name='download'/>Export These Results
					</Button>
				</CSVLink>
			);
		}else{
			return(
				<Button style={{height: 40}} primary disabled>
					<Icon name='download'/>Export These Results
				</Button>
			)
		}
	}
	
	declareCommercials(trash_id, title, artist){
		var postData = {
			title: title,
			artist: artist,
		}
		axios.post(config.get('api_url') + 'commercials/add', postData).then(res => {
			
			// Disable buttons
			var buttonsToDisable = document.querySelectorAll('.spin-result-button-'+trash_id);
			for (const button of buttonsToDisable) {
				button.classList.add('disabled')
			}
			
			// Grey out rows
			var rowsToDisable = document.querySelectorAll('.spin-result-'+trash_id);
			var i = 0;
			for (const elem of rowsToDisable) {
				// elem.remove();	// This throws a WEEEEEIIIRRRRDDDD error :[
				elem.classList.add('gray-out')
				i++;
				if(i === rowsToDisable.length){	// Once all elements have been removed...
					if(document.querySelectorAll('.spin-result-row').length === 0){	// If all the rows inside the table are gone...
						window.location.reload()
					}
				}
			}
		})
	}
	
	render(){
		
		var displayNoSpins = {
			display: 'none'
		};
		if(this.state.no_spins){
			displayNoSpins = {
				textAlign: 'center',
				fontSize: 16,
			};
		}
		var displayPagination = {}	// Empty til no spins
		if(this.state.no_spins){
			displayPagination = {display: 'none'};
		}
		
		return(
			// <Segment id="spins" className="page grid-container">
			<Segment id="spins" className="page">
				<div className="grid-x grid-margin-x">
					<PageHeader
						h1='Search Results'
						link='/spins'
						iconName='headphones'
						instructions='Search results are below. To refine results, please click "Modify Search". For owned spins, please use the Summary tools.'
					/>
					<div className="cell shrink">
						{/* <Label size='large' style={{marginBottom: 15, backgroundColor: '#2b2545', color: '#fff'}}> */}
							{/* <Icon name='headphones'/>Total Spins: <strong>{ this.state.loading ? "Loading..." : this.state.spin_ct }</strong> */}
						{/* </Label> */}
						<Link to={'/search' + this.props.location.search}>
							<Button style={{marginBottom: 15, backgroundColor: '#2b2545', color: '#fff'}}>
								<Icon name='search'/>Modify Search
							</Button>
						</Link>
						{ this.renderExportButton() }
					</div>
				</div>
				<div className='grid-x grid-margin-x'>
					<div className="cell small-12 table-scroll">
						<Table celled compact striped size='small' unstackable>
							
							{/* TABLE HEADER & NAVIGATION */}
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell>Title</Table.HeaderCell>
									<Table.HeaderCell>Artist</Table.HeaderCell>
									<Table.HeaderCell>Channel</Table.HeaderCell>
									<Table.HeaderCell>Date</Table.HeaderCell>
									<Table.HeaderCell>Time</Table.HeaderCell>
									<Table.HeaderCell>Actions</Table.HeaderCell>
								</Table.Row>
								<Table.Row style={displayPagination}>
									<Table.HeaderCell textAlign='center' colSpan={ 6 }>
										<Menu compact secondary size='mini'>
											<Menu.Item as='a' icon onClick={ () => console.log("Click backward") }>
												<Icon name='chevron left' />
											</Menu.Item>
											{ this.state.pagination.map(pageNum => {
												return(
													<Menu.Item 
														active={ this.state.page === pageNum }
														onClick={ () => this.spinPagination(pageNum)} 
														key={ pageNum }
														as='a'>{ pageNum }</Menu.Item>
												);
											})}
											<Menu.Item as='a' icon onClick={ () => console.log("Click forward") }>
												<Icon name='chevron right' />
											</Menu.Item>
										</Menu>
									</Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							
							{/* MAP SPINS */}
							<Table.Body>
								<TableBodyLoader loading={ this.state.loading } cols={5} message="Loading Spins..." />
								<Table.Row style={displayNoSpins}>
									<Table.Cell colSpan={6}>
										<p style={{marginTop: '30px',marginBottom: '30px'}}>No Spins match this criteria.</p>
									</Table.Cell>
								</Table.Row>
								
								{ this.state.spins.map( spin => {
									var trash_id = spin.title.replace(/[\W_]+/g,"-");
									return(
										<Table.Row key={ spin.prs_id } className={ "spin-result-row spin-result-"+trash_id }>
											<Table.Cell>{ spin.title }</Table.Cell>
											<Table.Cell>{ spin.artist }</Table.Cell>
											<Table.Cell>{ spin.display_channel }</Table.Cell>
											<Table.Cell>{ spin.display_date }</Table.Cell>
											<Table.Cell>{ spin.display_time }</Table.Cell>
											<Table.Cell collapsing>
												<Button.Group basic size='small'>
													<TableActionButton buttonClass={"spin-result-button-"+trash_id} link={ false } actionName={ 'This is a Commercial' } actionIcon='ban' onClick={ () => { this.declareCommercials(trash_id, spin.title, spin.artist) }}/>
												</Button.Group>
											</Table.Cell>
										</Table.Row>
										);
									})}
								</Table.Body>
						</Table>
					</div>
				</div>
			</Segment>
		);
	}
}

export default SearchResults;