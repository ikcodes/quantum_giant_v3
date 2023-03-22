import React from 'react';
import axios from 'axios';
// import queryString from 'query-string';
// import { Link } from 'react-router-dom';
import config from 'react-global-configuration';
import { 
	Button,
	Icon,
	Menu,
	// Popup,
	// Segment,
	Table,
	// Tab,
} from 'semantic-ui-react';

import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import AddButton from '../../components/AddButton';
import PageHeader from '../../components/PageHeader';
import TableBodyLoader from '../../components/TableBodyLoader';
import ViewSummaryButton from '../../components/ViewSummaryButton';
import TableActionButton from '../../components/TableActionButton';

const numLetters = 12;	// Letters in table nav
//=======================================
//					ALBUM: LIST VIEW
//=======================================
class AlbumList extends React.Component{
  constructor(props){
		super(props);
		this.state = {
			albums: [],
			breadcrumbs_1: '',
			breadcrumbs_1_url: '',
			breadcrumbs_2: '',
			breadcrumbs_2_url: '',
			instructions: '',
			loading: false,
			
			current_artist: props.activeArtist ? props.activeArtist : null,	// Filter by artist!
			current_label: props.activeLabel ? props.activeLabel : null,	// Filter by LABEL!
			
			// Letter scrolling mechanism.
			all_letters: [],
			current_letter: props.activeLetter ? props.activeLetter : 'a',
			current_letters: [],
			cl_slice_start: 27,
			cl_slice_end: 27 + numLetters,
		}
		this.getAlbums = this.getAlbums.bind(this);
		this.deleteAlbum = this.deleteAlbum.bind(this);
		this.filterAlbums = this.filterAlbums.bind(this);
    this.letterForward = this.letterForward.bind(this);
    this.letterBackward = this.letterBackward.bind(this);
	}
	
  componentDidMount(){
		this.getAlbums();
	}
	
	getAlbums(){
		this.setState({
			loading: true,
			albums: [],
		}, () => {
			let postData = {};
			
			// Tricky stuff here, considering 0 is unaffiliated. Keep an eye on it.
			if(this.state.current_label === 0){
				// console.log('GETTING ALBUMS BY *UNDEFINED* LABEL!');
				postData['label_id'] = 0;
			}else if(this.state.current_label){
				// console.log('GETTING ALBUMS BY LABEL!!!');
				postData['label_id'] = this.state.current_label;
			}else if(this.state.current_artist){
				// console.log('GETTING ALBUMS BY ARTIST!');
				postData['artist_id'] = this.state.current_artist;
			}else if(this.state.current_letter){
				// console.log('GETTING ALBUMS BY LETTER!');
				postData['letter'] = this.state.current_letter;
			}
			
			axios.post(config.get('api_url')+'albums/load', postData).then(res => {
				console.log('RES DATA SHOULD HAVE:');
				console.log(res.data);
				console.log(res.data.breadcrumbs_1_url);
				let spreadLetters = res.data.letters ? [...res.data.letters, ...res.data.letters, ...res.data.letters] : [];
				this.setState({
					loading: false,
					albums: res.data.albums,
					artist: res.data.artist ? res.data.artist : {},
					all_letters: spreadLetters,
					current_letters: res.data.letters ? spreadLetters.slice(this.state.cl_slice_start, this.state.cl_slice_end) : [],
					breadcrumbs_1: res.data.breadcrumbs_1 ? res.data.breadcrumbs_1 : this.state.breadcrumbs_1,
					breadcrumbs_2: res.data.breadcrumbs_2 ? res.data.breadcrumbs_2 : this.state.breadcrumbs_2,
					breadcrumbs_1_url: res.data.breadcrumbs_1_url ? res.data.breadcrumbs_1_url : this.state.breadcrumbs_1_url,
					breadcrumbs_2_url: res.data.breadcrumbs_2_url ? res.data.breadcrumbs_2_url : this.state.breadcrumbs_2_url,
				},
				() => {
					// console.log(this.state);	// See how getAlbums came back
				}
			)});
		});
	}
	
	// LETTER PAGINATION
	//-------------------
	letterForward(event){
		let newStart, newEnd;
		this.setState(prevState => {
			newStart = prevState.cl_slice_start + 1;
			newEnd = prevState.cl_slice_end + 1;
			return {
				cl_slice_end: newEnd,
				cl_slice_start: newStart,
				current_letters: prevState.all_letters.slice(newStart, newEnd)
			}
		}, () => {  });
	}
	
	letterBackward(event){
		let newStart, newEnd;
		this.setState(prevState => {
			newStart = prevState.cl_slice_start - 1;
			newEnd = prevState.cl_slice_end - 1;
			return {
				cl_slice_end: newEnd,
				cl_slice_start: newStart,
				current_letters: prevState.all_letters.slice(newStart, newEnd)
			}
		}, () => {  });
	}
	
	
	// DELETE
	//--------------
	deleteAlbum(album_id, album_title){
		confirmAlert({
			title: 'Deleting '+album_title+'',
			message: 'Really remove '+album_title+' from Quantum Giant, including all associated tracks?',
			buttons: [
				{
					label: 'Yes',
					onClick: () => {
						const deleteUrl = config.get('api_url') + 'albums/delete';
						const postData = {
							 album_id:  album_id,
						}
						axios.post(deleteUrl, postData).then(res => {
							if(res.data.success >= 1){
								window.location.reload();
							}else{
								alert("There was a problem deleting the album. Please refresh the page and try again.");
							}
						});
					}
				},
				{
					label: 'No',
					onClick: () => alert('Glad I asked ;)')
				}
			]
		});
	}

	// FILTER BY LETTER
	//------------------
	filterAlbums(letter, e){
		axios.post(config.get('api_url')+ 'albums/albums-by-letter', {letter: letter}).then(res => {
			this.setState({
				albums: res.data.albums,
				current_letter: letter,
				breadcrumbs_2: letter,
			});
		});
	}
	
  render(){
		
		let addAlbumHref = '/albums/edit/add'
		let addAlbumHTML = ''
		
		if(this.state.current_artist){
			addAlbumHref += '?artist_id='+this.state.current_artist;
			addAlbumHTML = <AddButton link={ addAlbumHref } text="Add New Album" />
		}
		
		let viewSummaryText = null
		let viewSummaryHref = null
		if(this.state.current_artist){
			viewSummaryHref = "/summary/artist?artist_id="+this.state.current_artist;
			viewSummaryText = "View Artist Summary"
		}else if(parseInt(this.state.current_label) >= 0){
			viewSummaryHref = "/summary/label?label_id="+this.state.current_label;
			viewSummaryText = "View Label Summary"
		}
		
    return(
			<div className="grid-x grid-margin-x">
				
				{/* PAGE HEADER + BREADCRUMBS */}
				<PageHeader 
					h1="Albums"
					link="/albums"
					iconName="clone"
					breadcrumbs_1={this.state.breadcrumbs_1}
					breadcrumbs_2={this.state.breadcrumbs_2}
					instructions={this.state.instructions}
				/>
				
				{/* ADD ALBUM */}
				{ addAlbumHTML }
				{/* <AddButton link={ addAlbumHref } text="Add New Album" /> */}
				
				{/* VIEW (ARTIST/LABEL) SUMMARY */}
				<ViewSummaryButton link={ viewSummaryHref } text={ viewSummaryText } style={{ marginTop: "5px" }}/>
				
				{/* LIST ALBUMS */}
				<div className="cell small-12 table-scroll">
					<Table celled compact striped size='small' unstackable>
						
						{/* TABLE HEADER & NAVIGATION */}
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell>Album</Table.HeaderCell>
								<Table.HeaderCell style={{textAlign:'left'}}>Artist</Table.HeaderCell>
								<Table.HeaderCell style={{textAlign:'left'}}>Release</Table.HeaderCell>
								<Table.HeaderCell style={{textAlign:'left'}}>Catalog #</Table.HeaderCell>
								<Table.HeaderCell style={{textAlign:'left'}} collapsing>Spins</Table.HeaderCell>
								<Table.HeaderCell style={{textAlign:'left'}} collapsing colSpan={2}>Metadata</Table.HeaderCell>
							</Table.Row>
							<Table.Row style={ this.state.current_artist || parseInt(this.state.current_label) >= 0 ? { display:'none'} : {} }>
								<Table.HeaderCell textAlign='center' colSpan={7} id="artistsLetterMenu">
									<Menu compact secondary size='mini'>
										<Menu.Item as='a' icon onClick={ this.letterBackward }>
											<Icon name='chevron left' />
										</Menu.Item>
										{ this.state.current_letters.map( letter => {
											return(
												<Menu.Item 
													active={ this.state.current_letter === letter }
													onClick={(e) => this.filterAlbums(letter, e)}
													key={ letter }
													style={{textTransform: 'uppercase'}}
													as='a'>{ letter }</Menu.Item>
											);
										})}
										<Menu.Item as='a' icon onClick={ this.letterForward }>
											<Icon name='chevron right' />
										</Menu.Item>
									</Menu>
								</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						
						{/* TABLE BODY */}
						<Table.Body>
							<TableBodyLoader loading={ this.state.loading } cols={7} message="Loading Albums..." slow={true} />
							{this.state.albums.map( album => {
								const albumId = album['album_id'];
								const albumHref = '/albums/edit/'+albumId;
								const trackHref = '/tracks/album/'+albumId;
								var artistHref = '/artists/';
								var artistName = (album['artist'] === null || album['artist'] === undefined ) ? 'NULL' : album['artist']['artist_name'];
								if(album && album['album_is_compilation'] !== undefined && (album['artist']['artist_id'] !== undefined || album['artist']['artist_id'] === null)){
									artistHref = parseInt(album['album_is_compilation']) === 1 ? '/artists/' : '/artists/edit/'+album['artist']['artist_id'];
								}
								return(
									<Table.Row key={album['album_id']}>
										<Table.Cell>{ album['album_title'] }</Table.Cell>
										<Table.Cell>{ artistName }</Table.Cell>
										<Table.Cell>{ album['album_release_date'] || ''}</Table.Cell>
										<Table.Cell>{ album['album_cat_num'] || ''}</Table.Cell>
										<Table.Cell collapsing>
											<Button.Group basic size='small'>
												<TableActionButton link={ '/summary/album?album_id='+albumId } actionName='View Album Summary' actionIcon='chart pie' />
											</Button.Group>
										</Table.Cell>
										<Table.Cell collapsing>
											<Button.Group basic size='small'>
												<TableActionButton link={ trackHref } actionName={'View All Tracks on "' + album['album_title'] + '"'} actionIcon='list' />
												<TableActionButton link={ artistHref } actionName={'View artist details for ' + album['artist']['artist_name'] } actionIcon='user' />
											</Button.Group>
										</Table.Cell>
										<Table.Cell collapsing>
											<Button.Group basic size='small'>
												<TableActionButton link={ albumHref } actionName='Edit Album' actionIcon='edit' />
												<TableActionButton link={ false } actionName={ 'Delete Album' } actionIcon='trash' onClick={ ()=>{ this.deleteAlbum(album['album_id'], album['album_title'] )}}/>
											</Button.Group>
										</Table.Cell>
									</Table.Row>
								);
							})}
						</Table.Body>
					</Table>
				</div>
			</div>
    );
  }
}

export default AlbumList;