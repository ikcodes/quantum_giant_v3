import React from 'react';
import axios from 'axios';
import queryString from 'query-string';
import config from 'react-global-configuration';
import PageHeader from '../components/PageHeader';
import DateFiltering from '../components/DateFiltering';
import ChannelFiltering from '../components/ChannelFiltering';
import {
	Button, 
	// Checkbox,
	Form,
	Segment, 
	Icon,
	// Table
} from 'semantic-ui-react';
import {
	Redirect 
} from 'react-router-dom';

class Search extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			params: {
				artist_name: '',
				track_title: '',
				channel: '',
				start_date: '',
				end_date: '',
			},
			disableButton: true,	// Have to have criteria!
		}
		
		this.handleEndDate = this.handleEndDate.bind(this);
		this.searchForSpins = this.searchForSpins.bind(this);
		this.handleChannels = this.handleChannels.bind(this);
		this.handleStartDate = this.handleStartDate.bind(this);
		this.parseQueryString = this.parseQueryString.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
		this.manageSubmitButton = this.manageSubmitButton.bind(this);
	}
	
	componentDidMount(){
		this.parseQueryString();
		this.manageSubmitButton();
	}
	
	manageSubmitButton(){
		let disableButton = (
			this.state.params.artist_name === '' && 
			this.state.params.track_title === '' && 
			this.state.params.channel === '' && 
			this.state.params.start_date === '' && 
			this.state.params.end_date === ''
		) || this.state.params === {};
		console.log("MANAGING DISABLE ==> " + disableButton);
		console.log(this.state.params);
		return disableButton;
	}
	
	parseQueryString(){
		let queryValues = queryString.parse(decodeURI(this.props.location.search));
		console.log("Query Values passed:");
		console.log(queryValues);
		if(Object.keys(queryValues).length !== 0){	// ONLY OVERWRITE QUERY VALUES IF ANY ARE PASSED
			this.setState({
				params: queryValues,
			}, () => {
				
				// TRY TO MAP ARTIST/TRACK ID TO TITLE
				
				if(this.state.params.artist_id){
					axios.post(config.get('api_url') + 'artists/artist-name-by-id', { id: this.state.params.artist_id }).then(res => {
						if(res.data.name){
							console.log(res.data.name);
							this.setState( prevState => {
								let params = prevState['params'];
								params['artist_name'] = res.data.name;
								return{
									params: params
								}
							});
						}else{
							console.log("Res is fucked! No artist matched.");
						}
					})
				}
				if(this.state.params.track_gid){
					axios.post(config.get('api_url') + 'tracks/track-title-and-artist-by-gid', {
						gid: this.state.params.track_gid
					}).then(res => {
						if(res.data.title){
							console.log(res.data.title);
							this.setState( prevState => {
								let params = prevState['params'];
								params['track_title'] = res.data.title;
								params['artist_name'] = res.data.artist;
								return{
									params: params
								}
							});
						}else{
							console.log("Res is fucked! No title matched.");
						}
					})
				}
			});
		}
	}
	
	// BUILD QUERY STRING FOR SEARCH PAGE TO READ
	searchForSpins(){
		var url = '/spins?';
		if(this.state.params.channel){
			url += 'channel='+encodeURI(this.state.params.channel)+'&';
		}
		if(this.state.params.start_date){
			url += 'start_date='+encodeURI(this.state.params.start_date)+'&';
		}
		if(this.state.params.end_date){
			url += 'end_date='+encodeURI(this.state.params.end_date)+'&';
		}
		if(this.state.params.artist_name){
			url += 'artist_name='+encodeURI(this.state.params.artist_name)+'&';
		}
		if(this.state.params.track_title){
			url += 'track_title='+encodeURI(this.state.params.track_title)+'&';
		}
		if(url.length){
			const finalUrl = url.slice(0, -1);
			this.setState({
				redirect_url: finalUrl
			});
		}else{
			console.log("Could not complete search!");
		}
	}
	
	handleInputChange(event){
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
		const name = target.name;
    this.setState( state => {
			const params = state.params;
			params[name] = value;
			console.log("handleInputChange");
			return{
				params: params
			}
		});
	}
	
	handleStartDate = (event, {name, value}) => {
		let params;
		this.setState(prevState => {
			params = prevState.params;
			params['start_date'] = value;
			console.log("handleStartDate");
			return{ params:params }
		});
	}
	
	handleEndDate = (event, {name, value}) => {
		let params;
		this.setState(prevState => {
			params = prevState.params;
			params['end_date'] = value;
			console.log("handleEndDate");
			return{ params:params }
		});
	}
	
	handleChannels = (event, {name, value}) => {
		console.log("handleChannels");
		if(event){
			const channelId = event.value;
			let params;
			this.setState(prevState => {
				params = prevState.params;
				params['channel'] = channelId;
				return{ params:params }
			});
		}else{
			this.setState(state => {
				let params = state.params;
				delete params.channel;
				console.log("DELETING PARAMS CHANNEL!");
				return{
					params: params
				}
			})
		}
	}
	
	render(){
		
		if(this.state.redirect_url){
			return (
				<Redirect to={encodeURI(this.state.redirect_url)} />
			);
		}
		
		return(
			<Segment id="spins" className="page grid-container">
				<div className="grid-x grid-margin-x">
					<PageHeader
						h1="Search" 
						link="/spins"
						iconName="search"
						instructions="Use the search fields below to query the data warehouse."
					/>
					<div className='cell'>
						<Form autoComplete="off" onSubmit={this.searchForSpins} style={{marginBottom: 30}}>
							
							{/* CHANNEL */}
							<div className='grid-x grid-margin-x'>
								<div className='cell ui form' style={{marginBottom: 20}}>
									<div className="field">
										<label>Channel</label>
										<ChannelFiltering
											activeChannel={ parseInt(this.state.params.channel) }
											onChange={ this.handleChannels }
										/>
									</div>
								</div>
							</div>
							
							{/* ARTIST / TRACK */}
							<div className="grid-x grid-margin-x">
								<div className='cell'>
									<Form.Input
										label="Artist Name"
										name="artist_name"
										type="text"
										value={this.state.params['artist_name'] || ''}
										onChange={this.handleInputChange} />
									<Form.Input
										label="Track Title"
										name="track_title"
										type="text"
										value={this.state.params['track_title'] || ''}
										onChange={this.handleInputChange} />
								</div>
							</div>
								
							{/* START / END DATE */}
							<div className="grid-x grid-margin-x">
								<div className='cell medium-6'>
									<div className="field">
										<label style={{marginTop: 15}}>Start Date</label>
										<DateFiltering 
											placeholder="Starting on..."
											onChange={ this.handleStartDate }
											value={ this.state.params['start_date'] }
											/>
									</div>
								</div>
								<div className="cell medium-6">
									<div className="field">
										<label style={{marginTop: 15}}>End date</label>
										<DateFiltering 
											placeholder="Ending on..."
											onChange={ this.handleEndDate }
											value={ this.state.params['end_date'] }
										/>
									</div>
								</div>
							</div>
							
							{/* CAREFUL! */}
							{/* ============================================================================ */}
							<input type='hidden' name='track_gid' value={ this.state.params.track_gid || '' } />
							<input type='hidden' name='album_id'  value={ this.state.params.album_id  || '' } />
							<input type='hidden' name='artist_id' value={ this.state.params.artist_id || '' } />
							{/* ============================================================================ */}
							
							{/* SUBMIT */}
							<div className="cell">
								<Button primary type="submit" icon style={{width: '100%', marginTop: 20}} disabled={ this.manageSubmitButton() }>
									<Icon name='search'/>&nbsp;&nbsp;&nbsp;Search
								</Button>
							</div>
						</Form>
					</div>
				</div>
			</Segment>
		);
	}
}

export default Search;