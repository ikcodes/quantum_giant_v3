import React from 'react';
import axios from 'axios';
import config from 'react-global-configuration';
import { 
	Link, 
	Redirect 
} from 'react-router-dom';
import { 
	// Segment, 
	// Icon, 
	Button, 
	Checkbox,
	Form 
} from 'semantic-ui-react';

import Select from 'react-select-virtualized';
import { DateInput } from 'semantic-ui-calendar-react';

import PageHeader from '../../components/PageHeader';

import './css/AlbumEdit.css';

//=======================================
//					ALBUM: EDIT VIEW
//=======================================
class AlbumEdit extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			add: props.add,
			albumId: props.albumId,
			artistId: props.artistId,	// From query String
			labelId: props.labelId,
			
			toListView: false,	// Only true when we want to redirect to list view.
			all_artists: [],	// Dropdown contents (POST makes this)
			all_labels: [],	// Same
			
			// DB record. Alt Spellings live in here.
			// IF EDIT, it's filled by the post.
			album: {	// IF ADD, use this configuration (blank db record)
				album_title: '',
				album_is_single: false,
				album_is_compilation: false,
				album_release_date: '',
				album_upc: '',
				album_cat_num: '',
				artist_id: props.artistId ? props.artistId : null,
				label_id: props.labelId ? props.labelId : null,
				artist_name: '',
				alt_release_dates: [],
			},
			
			alt_spelling_text: 'Add Alternate Spelling',
			instructions: props.add ? 'Now adding new album.' : 'Now editing the album.',	// POST OR SESSION? BOTH?
			breadcrumbs_1: props.add ? 'New Album' : '',	// API reponds 
			breadcrumbs_2: props.add ? 'Add' : 'Edit',
		}
		
		this.saveAlbum = this.saveAlbum.bind(this);
		this.updateLabel = this.updateLabel.bind(this);
		this.toggleSingle = this.toggleSingle.bind(this);
		this.updateArtist = this.updateArtist.bind(this);
		this.toggleCompilation = this.toggleCompilation.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
		this.getDropdownArtists = this.getDropdownArtists.bind(this);
		
		// Release date stuff. Whoof.
		this.handleReleaseDate = this.handleReleaseDate.bind(this);
    this.addAlternateRelease = this.addAlternateRelease.bind(this);
    this.handleAlternateReleaseDate = this.handleAlternateReleaseDate.bind(this);
	}
	
	componentDidMount(){
		if(this.state.add){		// New album! No post.
			this.setState({
				instructions: "Adding new album.",
			}, () => {
				this.getDropdownArtists();
				// console.log("Artists in.");
				// console.log(this.state.all_artists);
				this.getDropdownLabels();
				// console.log('Labels in, too.');
				// console.log(this.state.all_labels);
			});
		}
		else{		// Post to edit existing album
			const postData = {
				album_id: this.state.albumId,
			};
			axios.post(config.get('api_url')+'albums/edit-album', postData).then(res => {
				if(res.data.album){
					this.setState({
						album: res.data.album,
						breadcrumbs_1: res.data.album['album_title'],
						instructions: 'Now editing album metadata for '+ res.data.album['album_title'] + '.',
					}, ()=> {
						// console.log('ALBUM FROM API:');
						// console.log(res.data.album);
						// console.log('------------');
						this.getDropdownArtists();
						this.getDropdownLabels();
					});
				}else{
					console.log(res);
					console.log("Problem getting album!!");
				}
			});
		}
	}
	
	//------------------------------------------------
	// 									SAVE ALBUM
	//------------------------------------------------
	saveAlbum(){
		const postData = {
			album: this.state.album,
			add: this.state.add,
		}
		console.log("Postdata going to API:");
		console.log(postData);
		const debug = false;
		if(this.state.album['album_title'] && debug === false){
			axios.post(config.get('api_url')+'albums/update-album', postData).then(res => {
				if(res.data.album){
					const newAlbum = res.data.album;
					const backTo = newAlbum['album_title'].length ? newAlbum['album_title'].substring(0,1).toLowerCase() : 'a'
					this.setState({
						breadcrumbs_1: res.data.breadcrumbs_1,
						breadcrumbs_2: 'Edit',
						instructions: "Successfully " + ( this.state.add ? 'add' : 'updat' ) + "ed " + postData['album']['album_title'] + "!",
						album: newAlbum,
						albumId: res.data.album['album_id'],
						add: false,
						toListView: true,	// Either redirect on exit or force reload w/ ID
						toListViewUrl: '/albums/'+(backTo)
					});
				}else{
					console.log("BAD RESPONSE!");
					console.log(res);
				}
			});
		}else{
			console.log("BAILING OUT! PostData:");
			console.log(postData);
			this.setState({
				instructions: "Failed to update album!",
				add: 0,
			});
		}
	}
	
	// GET DROPDOWN ARTISTS
	//---------------------------------------------------
	getDropdownArtists(){
		axios.get(config.get('api_url')+'artists/load-for-dropdown').then(res => {
			if(res.data.artists !== undefined){
				this.setState({
					all_artists: res.data.artists.map(artist => {
						return {
							value: artist['artist_id'],
							label: artist['artist_name'],
						}
					})
				}, () => {
					// console.log("WE HAVE ARTISTS:");
					// console.log(this.state.all_artists);
				})
			}
		})
	}
	
	// GET DROPDOWN LABELS
	//---------------------------------------------------
	getDropdownLabels(){
		axios.get(config.get('api_url')+'albums/labels-for-dropdown').then(res => {
			console.log(res);
			if(res.data.labels !== undefined){
				this.setState({
					all_labels: res.data.labels.map(label => {
						return {
							value: label['label_id'],
							label: label['label_name'],
						}
					})
				}, () => {
					// console.log("WE HAVE LABELS!");
					// console.log(this.state.all_labels);
				})
			}
		})
	}
	
	
	// PAGE STATE FUNCTIONS
	//--------------------------------------------------
	handleInputChange(event) {
		const target = event.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		const name = target.name;
		const currAlbum = this.state.album;
		currAlbum[name] = value;
    this.setState({
      album: currAlbum,  // New object with updated property.
		}, () => {
			// console.log(this.state.album);
		});
	}
	
	toggleCompilation = () => {
		this.setState(prevState => {
			const newAlbum = prevState.album;
			const newComp = !newAlbum['album_is_compilation'];
			newAlbum['album_is_compilation'] = newComp;
			newAlbum['artist_id'] = newComp ? 0 : newAlbum['artist_id'];	// If turning to comp, set artist ID to zero.
			return{ album: newAlbum };
		});
	}
	
	toggleSingle = () => {
		this.setState(prevState => {
			const newAlbum = prevState.album;
			newAlbum['album_is_single'] = !newAlbum['album_is_single'];
			return{ album: newAlbum };
		});
	}
	
	updateArtist = (event) => {
		// console.log("UPDATING ARTIST!");
		let album, artist_id, artist_name;
		if(event){
			artist_id = event.value;
			artist_name = event.label;
		}else{
			artist_id = 0;
			artist_name = 'Compilation';
		}
		this.setState(prevState => {
			album = prevState.album;
			album['artist_id'] = artist_id;
			album['artist_name'] = artist_name;
			return{ album: album };
		}, () => {
			// console.log(this.state.album);
		});
	}
	
	updateLabel = (event) => {
		console.log("UPDATING LABEL!");
		console.log(event);
		let album, label_id, label_name;
		if(event){
			label_id = event.value;
			label_name = event.label;
		}else{
			label_id = 0;
			label_name = 'No Label';
		}
		this.setState(prevState => {
			// console.log('SETTING THIS as LABEL ID:' + label_id);
			album = prevState.album;
			album['label_id'] = label_id;
			album['label_name'] = label_name;
			return{ album: album };
		}, () => {
			// console.log('Label set:');
			// console.log(this.state.album);
		});
	}
	
	addAlternateRelease(){
		this.setState(prevState => {
			var newAlbum = prevState.album;
			newAlbum.alt_release_dates.push('');
			return{
				album: newAlbum
			}
		}, 
		() => {	
			console.log('state after adding:');
			// console.log(this.state);
		}
		);
	}
	
		
	handleReleaseDate = (event, {name, value}) => {
		let album;
		this.setState(prevState => {
			album = prevState.album;
			album['album_release_date'] = value;
			return{ album:album }
		});
	}
	
	handleAlternateReleaseDate = (event, {name, value}) => {
		this.setState(prevState => {
			let currAlbum = prevState.album;
			if(name === 'alt_release_dates[0]'){	// This would get out of hand if we used more than 4 ALTERNATES.
				console.log('we got it!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
				currAlbum.alt_release_dates[0] = value;
			}else if(name === 'alt_release_dates[1]'){
				currAlbum.alt_release_dates[1] = value;
			}else if(name === 'alt_release_dates[2]'){
				currAlbum.alt_release_dates[2] = value;
			}else if(name === 'alt_release_dates[3]'){
				currAlbum.alt_release_dates[3] = value;
			}else{
				console.log('hit ELSE');
				// currAlbum[name] = value;
			}
			return{ album: currAlbum }
		});
	}
	
  render(){
		
		if(this.state.toListView === true){
			// Redux can work in nicely here to add Instructions / flash messages
			return <Redirect to={this.state.toListViewUrl || '/albums'} />
		}
		
		// Handle alternate release dates. ALWAYS a part of the this.state.album OBJECT.
		let showReleaseDateClass = this.state.album['alt_release_dates'] ? 'yes-release-date' : 'no-release-date';
		let altReleaseDateMarkup = this.state.album['alt_release_dates'].map((release_date, index) => {
			return(
				<div className='field' key={ index }>
					<label>Release Date</label>
					<DateInput
						// key={ index }
						animation="none"
						autoComplete="off"
						dateFormat="YYYY-MM-DD"
						name={ "alt_release_dates["+index+"]" }
						placeholder="Alternate Release Date"
						value={this.state.album['alt_release_dates'][index] || ''}
						iconPosition="left"
						onChange={this.handleAlternateReleaseDate}
					/>
				</div>
			);
		});
		
    return(
			<div className="grid-x grid-margin-x">
				
				{/* PAGE HEADER + BREADCRUMBS */}
				<PageHeader 
					h1="Albums"
					link="/albums/"
					iconName="user"
					breadcrumbs_1={this.state.breadcrumbs_1}
					breadcrumbs_2={this.state.breadcrumbs_2}
					instructions={this.state.instructions}
				/>
				
				<div className="cell large-7 medium-12">
					<Form autoComplete="off">
						
						{/* ALBUM NAME */}
						<Form.Input 
							onChange={this.handleInputChange} 
							name="album_title" 
							label='Album Title' 
							value={this.state.album['album_title'] || ''}/>
					
						{/* ARTIST DROPDOWN */}
						<div className="field">
							<label>Primary Artist</label>
							<Select 
								isDisabled={ this.state.album['album_is_compilation'] }
								value={ this.state.album['album_is_compilation'] ? 0 : this.state.all_artists.filter(option => option.value === this.state.album['artist_id'])}
								options={this.state.all_artists}
								onChange={(e) => this.updateArtist(e)}
							/>
						</div>
						
						{/* CHECKBOXES */}
						<Form.Group widths='equal'>
							<Checkbox
								label='Compilation'
								onChange={this.toggleCompilation}
								checked={ this.state.album['album_is_compilation'] }
								className='field'
							/>
							<Checkbox
								label='Single'
								onChange={this.toggleSingle}
								checked={ this.state.album['album_is_single'] }
								className='field'
							/>
						</Form.Group>
						
						{/* LABEL DROPDOWN */}
						<div className="field">
							<label>Record Label</label>
							<Select
								value={ this.state.album['label_id'] ? this.state.all_labels.filter(option => option.value === this.state.album['label_id']) : 1 }
								options={this.state.all_labels}
								onChange={(e) => this.updateLabel(e)}
							/>
						</div>
						
						{/* RELEASE DATE */}
						<div className="field">
							<label>Release Date</label>
							<DateInput
								animation="none"
								autoComplete="off"
								dateFormat="YYYY-MM-DD"
								name="release_date"
								placeholder="Date"
								value={this.state.album['album_release_date'] || ''}
								iconPosition="left"
								onChange={this.handleReleaseDate}
							/>
						</div>
						
						{/* ALT RELEASE DATES */}
						<div className={showReleaseDateClass}>
							{altReleaseDateMarkup}
						</div>
						<div>
							<Button onClick={this.addAlternateRelease} style={{marginBottom: '15px'}} circular size='mini' icon='plus'></Button>
							<p style={{display:"inline", marginLeft: "5px"}}>Add Alternate Release</p>
						</div>
						
						
						{/* UPC */}
						<Form.Input 
							onChange={this.handleInputChange} 
							name="album_upc" 
							label='UPC' 
							value={this.state.album['album_upc'] || ''}/>
						
						{/* Catalog Number */}
						<Form.Input 
							onChange={this.handleInputChange} 
							name="album_cat_num" 
							label='Catalog Number'
							value={this.state.album['album_cat_num'] || ''}/>
					<br />
						
						{/* SUBMIT FORM */}
						<Form.Group>
							<Form.Button onClick={(e) => {this.saveAlbum(this.state.album['album_id'], e)}}	primary size='small'>Save Album</Form.Button>
							<Link to={'/tracks/album/'+this.state.album['album_id']}>
								<Form.Button secondary size='small' style={{marginRight: '12px'}}>View Tracks on Album</Form.Button>
							</Link>
							<Link to={'/tracks/artist/'+this.state.album['artist_id']}>
								<Form.Button secondary size='small'>View All Tracks by Artist</Form.Button>
							</Link>
						</Form.Group>
					</Form>
				</div>
			</div>
    );
  }
}

export default AlbumEdit;