// Packages
import React from 'react';
import axios from 'axios';
import queryString from 'query-string';
import config from 'react-global-configuration';

// Components
import PageHeader from '../components/PageHeader';
import TableBodyLoader from '../components/TableBodyLoader';
import ChannelFiltering from '../components/ChannelFiltering';
import DateFiltering from '../components/DateFiltering';


// Chart shit
import {
	CartesianGrid,
	ResponsiveContainer,
	XAxis,
	YAxis,
	Tooltip,
	AreaChart,
	Area,
} from 'recharts';

// Semantic Elements
import {
	Button,
	Input,
	Segment,
	Table,
	Radio,
} from 'semantic-ui-react';
import { CSVLink } from "react-csv";
 

//===================================================

class ArtistSummary extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			
			custom_range: false,	// Switch between week (DEFAULT) and custom range
			custom_dates: {
				start: '',
				end: '',
			},
			
			loading: true,
			artist_id: 0,
			artist_name: '',
			channel: 0,	// 0 = all
			weeks_shown: 4,
			weeks_shown_text: 'Now viewing all spins in the Last 4 weeks.',
			summary: {
				spins: [],
				chartData: [],
			},
			csvExport: [[]]
		}
		this.queryCustom = this.queryCustom.bind(this);
		this.updateChannel = this.updateChannel.bind(this);
		this.queryForSummary = this.queryForSummary.bind(this);
		this.updateWeeksShown = this.updateWeeksShown.bind(this);
		this.renderExportButton = this.renderExportButton.bind(this);
		this.convertWeeksToText = this.convertWeeksToText.bind(this);
		this.activateCustomDates = this.activateCustomDates.bind(this);
		this.deactivateCustomDates = this.deactivateCustomDates.bind(this);
	}
	
	componentDidMount(){
		const init_qv = queryString.parse(this.props.location.search)
		if(init_qv.start_date && init_qv.end_date){
			var testState = {
				custom_range: true,
				weeks_shown_text: 'Now viewing all spins in a Custom Date Range.',
				custom_dates: {
					start: init_qv.start_date,
					end: init_qv.end_date,
				}
			}
			this.setState(testState, () => this.activateCustomDates())
		}
		else if(init_qv.start_date){
			var custom_dates2 = {...this.state.custom_dates}
			custom_dates2.start = init_qv.start_date
			var updatedState2 = {
				custom_range: true,
				weeks_shown_text: 'Now viewing all spins in a Custom Date Range.',
				custom_dates: custom_dates2,
			}
			this.setState(updatedState2, () => this.queryCustom())
		}else if(init_qv.weeks || init_qv.channel){
			// console.log('ELSE 3');
			this.setState({	// Start out with this state, but also let it be updated later.
				channel: parseInt(init_qv.channel) || this.state.channel,
				weeks_shown: parseInt(init_qv.weeks) || this.state.weeks_shown,
			}, () => this.queryForSummary())
		}else{
			// console.log('TOTAL ELSE');
			this.queryForSummary() 
		}
	}
	
	activateCustomDates(){
		this.setState({
			custom_range: true,
			weeks_shown_text: 'Now viewing all spins in a Custom Date Range.',
		}, () => {
			if(this.state.custom_dates.start.length){
				this.queryCustom()
			}
		})
	}
	
	deactivateCustomDates(){
		var weekText = this.convertWeeksToText(this.state.weeks_shown)
		this.setState({
			custom_range: false,
			weeks_shown_text: "Now viewing all spins in the " + weekText + ".",
		}, () => {
			this.queryForSummary()
		})
	}
	
	updateStartDate = (event, {name, value}) => {
		var custom_dates = {...this.state.custom_dates}
		custom_dates.start = value
		this.setState({custom_dates})
	}
	
	updateEndDate = (event, {name, value}) => {
		var custom_dates = {...this.state.custom_dates}
		custom_dates.end = value
		this.setState({custom_dates})
	}
	
	
	queryCustom(){
		
		if(!this.state.custom_dates.start.length){
			alert('Please select at least a start date!');
			return;
		}
		
		let queryValues = queryString.parse(this.props.location.search);
		if(queryValues.artist_id){
			this.setState({
				artist_id: parseInt(queryValues.artist_id),
				csvExport: [],
			}, () => {
				this.renderExportButton();	// BLANK IT OUT, & REPLACE WITH NEW $#!+
				var postData = {
					id: this.state.artist_id,
				}
				axios.post(config.get('api_url') + 'artists/artist-name-by-id', postData).then(res => {
					if(res.data.name){
						this.setState({
							artist_name: res.data.name,
							breadcrumbs_1_url: '/albums/artist/'+this.state.artist_id
						}, () => {
							const postData = {
								start_date: this.state.custom_dates.start,
								end_date: this.state.custom_dates.end,
								artist_id: this.state.artist_id,
								channel: this.state.channel
							}
							axios.post(config.get('api_url') + 'summary/artist-custom', postData).then(res => {
								if(res.data){
									this.setState({
										summary: res.data,
										loading: false,
										csvExport: res.data.csv,
									}, () => {
										this.renderExportButton();
									});
								}else{
									this.setState({
										loading: false,
										error: true,
									})
								}
							})
						});	// Outer wrapper
					}
				})
			});
		}
	}
	
	queryForSummary(){
		
		// 	TUCK IN CALLS TO QUERY CUSTOM HERE!
		if(this.state.custom_range){
			
			// console.log("AUTOMATICALLY CALLING QUERY CUSTOM...");	
			// return this.queryCustom() 
		}
		
		let queryValues = queryString.parse(this.props.location.search);
		if(queryValues.artist_id){
			this.setState({
				artist_id: parseInt(queryValues.artist_id),
				csvExport: [],
			}, () => {
				this.renderExportButton();	// BLANK IT OUT, & REPLACE WITH NEW $#!+
				var postData = {
					id: this.state.artist_id,
				};
				axios.post(config.get('api_url') + 'artists/artist-name-by-id', postData).then(res => {
					if(res.data.name){
						this.setState({
							artist_name: res.data.name,
							breadcrumbs_1_url: '/albums/artist/'+this.state.artist_id
						}, () => {
							const summaryPost = {
								artist_id: this.state.artist_id,
								weeks_shown: this.state.weeks_shown,
								channel: this.state.channel,
							};
							axios.post(config.get('api_url') + 'summary/artist', summaryPost).then(res => {
								let newWeekText = this.convertWeeksToText(this.state.weeks_shown)
								if(res.data){
									this.setState({
										summary: res.data,
										loading: false,
										csvExport: res.data.csv,
										weeks_shown_text: "Now viewing all spins in the " + newWeekText + ".",
									}, () => {
										this.renderExportButton();
									});
								}else{
									this.setState({
										loading: false,
										error: true,
									})
								}
							})
						});	// Outer wrapper
					}
				})
			});
		}else{
			console.log("We need an artist ID to not fuck this up!");
		}
	}
	
	updateChannel = (event, {name, value}) => {
		if(event){
			const channelId = event.value;
			this.setState({
				channel: channelId,
			}, () => {
				if(this.state.custom_range === true){
					this.queryCustom()
				}else{
					this.queryForSummary()
				}
			})
		}else{
			this.setState({
				channel: 0,
			}, () => {
				if(this.state.custom_range === true){
					this.queryCustom()
				}else{
					this.queryForSummary()
				}
			})
		}
	}
	
	updateWeeksShown(e){
		const newWeeks = parseInt(e.target.value);
		if(newWeeks >= 0 && newWeeks <= 26){	// Enforce this range
			this.setState({
				weeks_shown: newWeeks,
				weeks_shown_text: "Now viewing all spins in the " + this.convertWeeksToText(newWeeks) + ".",
			}, () => this.queryForSummary());
		}
	}
	
	convertWeeksToText(weekInt){
		return weekInt === 0 ? 'This Week' : ( weekInt === 1 ? 'Last Week' : 'Last ' + weekInt + ' weeks' );
	}
	
	
	// CONVERT to just creating a URL to hit the API endpoint
	
	renderExportButton(){
		if(this.state.csvExport.length > 1){	// Must be a blank object to avoid crashing the plugin onload. Thus, length = 1. Re-render when this changes.
			return (
				<CSVLink data={this.state.csvExport}>
					<Button style={{marginBottom: 30, width: '100%'}} primary>Export Artist Summary</Button>
				</CSVLink>
			);
		}else{
			return <Button style={{marginBottom: 15, width: '100%'}} primary disabled>Export Artist Summary</Button>
		}
	}
	
	renderSpinChart(){
		if(this.state.summary.spins.length && !this.state.loading && this.state.custom_range !== true){
			return(
				<ResponsiveContainer width="100%" height={360}>
					<AreaChart 
						data={this.state.summary.chartData}
						height={360}
						width={730} 
					>
						<defs>
							<linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#2b2545" stopOpacity={0.8}/>
								<stop offset="95%" stopColor="#2b2545" stopOpacity={0.5}/>
							</linearGradient>
						</defs>
						<XAxis dataKey="Week" />
						<YAxis />
						<CartesianGrid strokeDasharray="3 3" style={{marginBottom: 15}}/>
						<Tooltip />
						<Area isAnimationActive={true} type="monotone" dataKey="Spins" stroke="#2b2545" fillOpacity={1} fill="url(#colorUv)" />
					</AreaChart>
				</ResponsiveContainer>
			)
		}else if (this.state.custom_range === true){
			
			return <p>&nbsp;</p>
			
		}else if (!this.state.summary.spins.length && !this.state.loading){
			var uri = encodeURI('/search?artist_name='+this.state.artist_name);
			return(
				<div>
					<h3 style={{fontWeight: 'bold', color: '#2b2545'}}>No spins!</h3>
					<p>Please adjust your criteria, or <a style={{textDecoration: 'underline'}}href={uri}>search for this artist</a>.</p>
				</div>
			)
		}else{
			return (
				<p>Loading...</p>
			)
		}
	}
	
	render(){
		let displayTableStyle = ( this.state.summary.spins.length && !this.state.loading ? {} : {display: 'none'});
		let displayWeeksShown = ( this.state.custom_range ? {display: 'none'} : {marginBottom: 15});
		let displayCustomDates = ( this.state.custom_range ? {marginBottom: 15} : {display: 'none'});
		
		let metricsTableBody = <Table.Body>
			<TableBodyLoader margin='4px 0' loading={ !this.state.csvExport.length } cols={2} message="Loading Spin Metrics..." />
		</Table.Body>
		
		if(this.state.csvExport.length){
			metricsTableBody = <Table.Body>
			<Table.Row style={displayWeeksShown}>
				<Table.Cell>Best Week</Table.Cell>
				<Table.Cell>{this.state.summary.upper_bound}</Table.Cell>
			</Table.Row>
			<Table.Row style={displayWeeksShown}>
				<Table.Cell>Average Week</Table.Cell>
				<Table.Cell>{this.state.summary.average}</Table.Cell>
			</Table.Row>
			<Table.Row>
				<Table.Cell>Total in Period</Table.Cell>
				<Table.Cell>{this.state.summary.spin_ct}</Table.Cell>
			</Table.Row>
		</Table.Body>
		}
		
		return(
			<Segment id="spinSummary" className="page">
				<div className="grid-x grid-margin-x">
					<PageHeader
						h1='Artist Summary'
						link={ '/summary/artist?artist_id='+this.state.artist_id }
						iconName='headphones'
						instructions={ this.state.weeks_shown_text }
						breadcrumbs_1={ this.state.artist_name || null }
						breadcrumbs_1_url={ this.state.breadcrumbs_1_url || null }
						// breadcrumbs_2={ this.state.artist_name && this.state.weeks_shown_text ? this.state.weeks_shown_text : '' }
						// breadcrumbs_2_url={ this.state.breadcrumbs_2_url || null }
					/>
					<div id='queryCustomDatesContainer'>
						<Radio toggle checked={this.state.custom_range} onChange={this.state.custom_range === true ? this.deactivateCustomDates : this.activateCustomDates } label='Custom Dates' style={{marginBottom: 15}} />
					</div>
					
					{/* USER FILTERS */}
					<div className="cell medium-5 large-3">
						
						<Input style={displayWeeksShown} label='Weeks:' fluid type='number' onChange={this.updateWeeksShown} value={this.state.weeks_shown}/>
						
						{/* <Radio toggle onChange={this.state.custom_range === true ? this.deactivateCustomDates : this.activateCustomDates } label={this.state.custom_range === true ? 'Deactivate Custom Dates' : 'Activate Custom Dates'} /> */}
						{/* <Button onClick={this.state.custom_range === true ? this.deactivateCustomDates : this.activateCustomDates } style={{marginBottom: 15}}>
							{ this.state.custom_range === true ? 'Deactivate Custom Dates' : 'Activate Custom Dates' }
						</Button> */}
						
						<ChannelFiltering 
							activeChannel={ parseInt(this.state.channel) }
							onChange={ this.updateChannel }
						/>
						
						{/* RESPONSE METRICS */}
						<Table celled compact striped unstackable style={{margin: '20px 0'}}>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell colSpan={2}>Spin Metrics</Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							{ metricsTableBody }
						</Table>
						{ this.renderExportButton() }
					</div>
					
					{/* SPIN TABLE */}
					<div style={displayWeeksShown} className="cell medium-7 large-9">
						{ this.renderSpinChart() }
					</div>
					
					<div style={displayCustomDates} className="cell medium-7 large-9 ui form">
						<div className="grid-x align-middle">
							<div className='cell medium-shrink'>
								<div className="field">
									<label style={{minWidth: 100}}>Start Date</label>
								</div>
							</div>
							<div className='cell medium-auto large-shrink' style={{minWidth: 300, marginBottom: 15}}>
								<DateFiltering 
									placeholder="Starting on..."
									onChange={ this.updateStartDate }
									value={ this.state.custom_dates.start }
								/>
							</div>
						</div>
						<div className="grid-x align-middle">
							<div className='cell medium-shrink'>
								<div className="field">
									<label style={{minWidth: 100}}>End Date</label>
								</div>
							</div>
							<div className='cell medium-auto large-shrink' style={{minWidth: 300, marginBottom: 15}}>
								<DateFiltering 
									placeholder="Ending on..."
									onChange={ this.updateEndDate }
									value={ this.state.custom_dates.end }
								/>
							</div>
						</div>
						<div className='grid-x align-middle'>
							<div className='cell'>
								<Button id='queryCustomDates' onClick={ this.queryCustom } primary>Query Custom Dates</Button>
							</div>
						</div>
					</div>
					
					<div className="cell small-12 table-scroll">
						<Table size='small' celled compact striped unstackable style={displayTableStyle}>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell>Title</Table.HeaderCell>
									<Table.HeaderCell>Artist</Table.HeaderCell>
									<Table.HeaderCell>Channel</Table.HeaderCell>
									<Table.HeaderCell>Date</Table.HeaderCell>
									<Table.HeaderCell>Time</Table.HeaderCell>
									
									{/* UTC for Debug */}
									{/* <Table.HeaderCell>DB Time</Table.HeaderCell> */}
								</Table.Row>
							</Table.Header>
							<Table.Body>
								<TableBodyLoader loading={ this.state.loading } cols={5} message="Loading Artist Summary..." slow={true} />
								{ this.state.summary.spins.map( (spin, index) => {
									return(
										<Table.Row key={ index }>
											<Table.Cell>{ spin.title }</Table.Cell>
											<Table.Cell>{ spin.artist }</Table.Cell>
											<Table.Cell>{ spin.display_channel }</Table.Cell>
											<Table.Cell>{ spin.display_date }</Table.Cell>
											<Table.Cell>{ spin.display_time }</Table.Cell>
											{/* <Table.Cell>{ spin.db_time }</Table.Cell> */}
										</Table.Row>
									);
								})}
							</Table.Body>
						</Table>
					</div>
					<hr/>
				</div>
			</Segment>
		);
	}
}
export default ArtistSummary;