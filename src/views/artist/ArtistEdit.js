import React from 'react';
import axios from 'axios';
import config from 'react-global-configuration';
import { Link, Redirect } from 'react-router-dom';
import { 
	// Segment, 
	// Icon, 
	Button, 
	Form 
} from 'semantic-ui-react';

import PageHeader from '../../components/PageHeader';

//=======================================
//					ARTIST: EDIT VIEW
//=======================================
class ArtistEdit extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			add: props.add,
			toListView: false,	// Only true when we want to redirect to list view.
			artistId: props.artistId,
			
			// DB record. Alt Spellings live in here.
			artist: {
				alt_spellings: [],
				artist_url: '',
			},
			
			alt_spelling_text: "Add Alternate Spelling",
			instructions: props.add ? 'Now adding new artist.' : 'Now editing the artists.',	// POST OR SESSION? BOTH?
			breadcrumbs_1: props.add ? 'New Artist' : '',	// API reponds 
			breadcrumbs_2: props.add ? 'Add' : 'Edit',
		}
		
    this.addArtist = this.addArtist.bind(this);
    this.editArtist = this.editArtist.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
		this.addAlternateSpelling = this.addAlternateSpelling.bind(this);
	}
	
	componentDidMount(){	// Get current artist (artist_id passed from ArtistPage)
		const postData = {
			artist_id: this.state.artistId,
		};
		if(this.state.add){
			this.setState({
				artist: {
					alt_spellings: []
				},
				instructions: "Adding new artist.",
			});
		}else{
			axios.post(config.get('api_url')+'artists/edit-artist', postData).then(res => {
				if(res.data.artist){
					console.log(res.data.artist);
					this.setState({
						artist: res.data.artist,
						breadcrumbs_1: res.data.artist['artist_name'],
						instructions: 'Now editing artist metadata for '+ res.data.artist['artist_name'] + '.',
					}, ()=> { console.log(this.state );});
				}else{
					console.log("Problem getting artist!!");
				}
			});
		}
	}
	
	addArtist(){
		this.setState({
			artist: {},
			alt_spelling_text: "Add Alternate Spelling",
			breadcrumbs_1: "New Artist",
			instructions: 'Now adding new artist! Hooray!',
			showSpellingClass: false,
		}, 
			() => console.log(this.state)
		);
	}
	
	editArtist(artist_id, e){
		axios.post(config.get('api_url')+'artists/edit-artist', {artist_id: artist_id}).then(res => {
			this.setState({
				action: 'edit',
				artist: res.data.artist,
				breadcrumbs_1: res.data.artist['artist_name'],
				instructions: 'Now editing artist metadata for ' + res.data.artist['artist_name'] +'.',
			}, 
				() => console.log(this.state)
			);
		});
	}
	
	saveArtist(artist_id, e){
		if(this.state.artist['artist_name']){
			const saveData = {
				add: this.state.add,
				artist_id: artist_id,
				artist_name: this.state.artist['artist_name'],
				alt_spellings: this.state.artist['alt_spellings'],
				artist_url: this.state.artist.artist_url,
			}
			axios.post(config.get('api_url')+'artists/update-artist', saveData).then(() => {
				var listLetter = saveData['artist_name'].charAt(0).toLowerCase();
				this.setState({
					toListView: true,
					toListViewUrl: '/artists/'+listLetter
				});
			});
		}
		else{	// No name. Bail out.
			this.setState({
				artist: {
					alt_spellings: [],
					artist_url: '',
				},
				breadcrumbs_1: '',
				instructions: "Could not add artist. Please refresh and try again.",
			});
		}
	}
	
	
	handleInputChange(event) {
		const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const currArtist = this.state.artist;
		if(name === 'alt_spellings[0]'){	// This would get out of hand if we used more than 4 ALTERNATES.
			currArtist.alt_spellings[0] = value;
		}else if(name === 'alt_spellings[1]'){
			currArtist.alt_spellings[1] = value;
		}else if(name === 'alt_spellings[2]'){
			currArtist.alt_spellings[2] = value;
		}else if(name === 'alt_spellings[3]'){
			currArtist.alt_spellings[3] = value;
		}else{
			currArtist[name] = value;
		}
    this.setState({
      artist: currArtist,  // New object with updated property.
		}, () => {
			// console.log(this.state.artist);
		});
	}
	
	addAlternateSpelling(){
		this.setState(prevState => {
			var newArtist = prevState.artist;
			newArtist.alt_spellings.push('');
			return{
				artist: newArtist
			}
		}, () => {	
				console.log('state after adding:');
				console.log(this.state);
			}
		);
	}
	
	render(){
		
		if(this.state.toListView === true){
			return <Redirect to={this.state.toListViewUrl || '/artists'} />
		}
	
		// Handle alternate spellings. ALWAYS a part of the this.state.artist OBJECT.
		let showSpellingClass = this.state.artist['alt_spellings'] ? 'yes-spelling' : 'no-spelling';
		let showSpellingStyle = this.state.artist['alt_spellings'] ? { marginBottom: '15px' } : {};
		let altSpellingMarkup = this.state.artist['alt_spellings'].map((spelling, index) => {
			return(
				<Form.Input 
					key={ index }
					onChange={ this.handleInputChange } 
					name={ "alt_spellings["+index+"]" }
					label='Alternate Spelling' 
					value={this.state.artist['alt_spellings'][index] || ''}/>
			);
		});
		
		return(
			<div className="grid-x grid-margin-x">
				
				{/* PAGE HEADER + BREADCRUMBS */}
				<PageHeader 
					h1="Artists"
					link="/artists"
					iconName="user"
					breadcrumbs_1={this.state.breadcrumbs_1}
					breadcrumbs_2={this.state.breadcrumbs_2}
					instructions={this.state.instructions}
				/>
				
				<div className="cell large-7 medium-12">
					<Form autoComplete='off'>
						
						<Form.Input 
							onChange={this.handleInputChange} 
							name="artist_name" 
							label='Artist Name' 
							value={this.state.artist['artist_name'] || ''}/>
						
						<Form.Input 
							onChange={this.handleInputChange} 
							name="artist_url" 
							label='Artist URL' 
							value={this.state.artist['artist_url'] || ''}/>
						{/* <p>Add 800PGR Catalog Search URLs here.</p> */}
						
						<div className={showSpellingClass} style={showSpellingStyle}>
							{altSpellingMarkup}
						</div>
						
						<div id="altSpellingContainer">
							<Button onClick={ this.addAlternateSpelling } circular size='mini' icon='plus' style={{ marginBottom: '15px' }}></Button>
							<p style={{ display:"inline", marginLeft: "5px" }}>Add Alternate Spelling</p>
						</div>
						
						<Form.Group>
							<Form.Button onClick={(e) => { this.saveArtist(this.state.artist['artist_id'], e)}} primary size='small'>Save Artist</Form.Button>
							<Link to={'/albums/artist/'+this.state.artist['artist_id']}>
								<Form.Button secondary size='small' style={{marginRight: '12px'}}>View Albums</Form.Button>
							</Link>
							<Link to={'/tracks/artist/'+this.state.artist['artist_id']}>
								<Form.Button secondary size='small'>View Tracks</Form.Button>
							</Link>
						</Form.Group>
					</Form>
				</div>
			</div>
		);
	}
}

 export default ArtistEdit;