import React from 'react';
import axios from 'axios';
import queryString from 'query-string';
import config from 'react-global-configuration';
import PageHeader from '../components/PageHeader';
import TableBodyLoader from '../components/TableBodyLoader';
import ChannelFiltering from '../components/ChannelFiltering';
import DateFiltering from '../components/DateFiltering';
import TableActionButton from '../components/TableActionButton';
import {
	Button,
	Segment,
	Table,
	// Icon,
	// Label,
	// Radio,
	// Input,
} from 'semantic-ui-react';

import { CSVLink } from "react-csv";

class TopSpinners extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			custom_dates: {
				start: '',
				end: '',
			},
			loading: false,
			just_loaded: false,
			spinSummary: [],
			channel: 0,
			csvExport: [[]],
			csvFilename: '', // Not declared but it gets set
			exportButtonMarkup: '',
		}
		
		this.wipeResults = this.wipeResults.bind(this);
		this.updateChannel = this.updateChannel.bind(this);
		this.updateTopSpinners = this.updateTopSpinners.bind(this);
		this.renderExportButton = this.renderExportButton.bind(this);
	}
	componentDidMount(){
		const init_qv = queryString.parse(this.props.location.search);
		if(init_qv.channel){
			this.setState({	// Start out with this state, but also let it be updated later.
				channel: parseInt(init_qv.channel) || this.state.channel,
			});
		}
		if(init_qv.start_date || init_qv.end_date || init_qv.go){
			var dates = {
				start: this.state.custom_dates.start,
				end: this.state.custom_dates.end,
			}
			if(init_qv.start_date){
				dates['start'] = init_qv.start_date;
			}
			if(init_qv.end_date){
				dates['end'] = init_qv.end_date;
			}
			this.setState({
				custom_dates: dates	// Ok no matter what; blank => blank if just 'go'
			}, () => { 
				console.log('SET DATES TO: ' + JSON.stringify(dates)); 
				
				if(parseInt(init_qv.go) === 1){	// Shortcut to GO
					this.updateTopSpinners()
				}
			})
		}
	}
	
	updateStartDate = (event, {name, value}) => {
		var custom_dates = {...this.state.custom_dates}
		custom_dates.start = value
		this.setState({custom_dates}, () =>{
			if(this.state.just_loaded){
				this.wipeResults();
			}
		})
	}
	
	updateEndDate = (event, {name, value}) => {
		var custom_dates = {...this.state.custom_dates}
		custom_dates.end = value
		this.setState({custom_dates}, () =>{
			if(this.state.just_loaded){
				this.wipeResults();
			}
		})
	}
	
	updateTopSpinners(){
		this.setState({
			loading: true,
			spinSummary: [],	// Empty table
			csvExport: [[]],
			csvFilename: '',
		}, () => {	// Get new summary
			
			this.renderExportButton()
			var postData = {
				start_date: this.state.custom_dates.start,
				end_date: this.state.custom_dates.end,
				channel: this.state.channel,
			}
			
			axios.post(config.get('api_url') + 'top-spinners/get-top-spinners', postData).then(res => {
				if(res.data.summary){
					this.setState({
						spinSummary: res.data.summary.spins,
						csvExport: res.data.csv,
						csvFilename: res.data.csv_filename,
						loading: false,
						just_loaded: true,
					}, () => {
						this.renderExportButton()
					});
				}else{
					console.log("Could not get shit!!!! No res.data.summary!");
					console.log(res.data);
				}
			});
		});
	}
	
	updateChannel = (event, {name, value}) => {
		if(event){
			const channelId = event.value;
			this.setState({
				channel: channelId,
			}, () => {
				if(this.state.just_loaded){
					this.wipeResults()
				}
			})
		}else{
			this.setState({
				channel: 0,
			}, () => {
				if(this.state.just_loaded){
					this.wipeResults()
				}
			})
		}
	}
	
	renderExportButton(){
		if(this.state.csvExport.length > 1){	// Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
				var mkp =  <CSVLink 
					data={this.state.csvExport}
					filename={this.state.csvFilename}
					>
					<Button style={{marginBottom: 15, marginTop: 15, width: '100%'}} primary>Export Top Spinners</Button>
				</CSVLink>;
				this.setState({
					exportButtonMarkup: mkp,
				});
		}else{
			this.setState({
				exportButtonMarkup: <Button style={{marginBottom: 15, marginTop: 15, width: '100%'}} primary disabled>Loading Top Spinners...</Button>
			})
		}
	}
	
	wipeResults(){
		this.setState({
			loading: false,
			spinSummary: [],
			csvExport: [[]],
			csvFilename: '', // Not declared but it gets set
			exportButtonMarkup: '',
		})
	}
	
	render(){
		
		let tableStyle={
			display: this.state.spinSummary.length ? 'table' : 'none'
		}
		
		return(
			<Segment id="spinSummary" className="page">
				<div className="grid-x grid-margin-x">
					<PageHeader
						h1='Top Spinners'
						link='/top-spinners'
						iconName='sort amount down'
						instructions="Select a channel, and/or a date range to see who spun the most during that period."
						breadcrumbs_1={ this.state.weeks_back_text }
						// breadcrumbs_2={ this.state.weeks_back_text && this.state.channel === 105 ? "She's So Funny" : '' }
					/>
					
					{/* CUSTOM DATE FILTERS */}
					<div className="cell">
						<div className="grid-x">
							<div className="cell large-8">
								<div className="grid-x grid-margin-x" style={{position: "relative"}}>
									{/* <Segment style={{width: '100%'}}> */}
										<div className="cell large-6" style={{marginTop: 0}}>
											<div className='ui form'>
												<div className="ui field">
													<label style={{minWidth: 100}}>Start Date</label>
													<DateFiltering 
														placeholder="Starting on..."
														onChange={ this.updateStartDate }
														value={ this.state.custom_dates.start }
													/>
												</div>
											</div>
										</div>
										
										<div className="cell large-6">
											<div className='ui form'>
												<div className="ui field">
													<label style={{minWidth: 100}}>End Date</label>
													<DateFiltering 
														placeholder="Ending on..."
														onChange={ this.updateEndDate }
														value={ this.state.custom_dates.end }
														/>
												</div>
											</div>
										</div>
										
										{/* CHANNEL FILTERING */}
										<div className="cell large-6" style={{marginTop: 15}}>
											<div id="channelFilteringContainer">
												<ChannelFiltering 
													activeChannel={ parseInt(this.state.channel) }
													onChange={ this.updateChannel }
												/>
											</div>
										</div>
										
										<div className='cell large-6' style={{marginTop: 15}}>
											{/* <Button id='queryCustomDates' onClick={ this.updateTopSpinners } primary>Query Custom Dates</Button> */}
											<Button style={{width: '100%'}} onClick={ this.updateTopSpinners } primary>Go!</Button>
										</div>
										
										{/* USER FILTERS */}
										<div className="cell">
											{ this.state.exportButtonMarkup }
										</div>
										
									{/* </Segment> */}
								</div>
							</div>
						</div>
					</div>

					
					{/* RESULTS TABLE */}
					<div className="cell small-12">
						<div className="grid-x">
							<div className="cell large-8">
								<Table celled compact striped unstackable style={tableStyle}>
									
									{/* TABLE HEADER & NAVIGATION */}
									<Table.Header>
										<Table.Row>
											<Table.HeaderCell>Artist</Table.HeaderCell>
											<Table.HeaderCell>Spin Count</Table.HeaderCell>
											<Table.HeaderCell collapsing textAlign='center'>Find Spins</Table.HeaderCell>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										<TableBodyLoader loading={ this.state.loading } cols={3} message="Loading Top Spinners..." slow={true} />
										{ this.state.spinSummary.map( (spin_count, index) => {
											var searchUrl = '/search?artist_name='+encodeURI(spin_count['artist_name'])
											return(
												<Table.Row key={ index }>
													<Table.Cell>{ spin_count['artist_name'] }</Table.Cell>
													<Table.Cell textAlign='center'><strong>{ spin_count['spin_ct'] }</strong></Table.Cell>
													<Table.Cell textAlign='center'>
														<Button.Group basic size='small'>
															<TableActionButton link={ searchUrl } actionName={ "Search Spins For "+spin_count['artist_name'] } actionIcon='search' />
														</Button.Group>
													</Table.Cell>
												</Table.Row>
											);
										})}
									</Table.Body>
								</Table>
							</div>
						</div>
					</div>
				</div>
			</Segment>
		);
	}
}

export default TopSpinners;