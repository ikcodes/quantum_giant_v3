import React from 'react';
import axios from 'axios';
// import queryString from 'query-string';
import config from 'react-global-configuration';
import PageHeader from '../components/PageHeader'
import DateFiltering from '../components/DateFiltering'
// import ExcelReader from '../excel/ExcelReader'
import { make_cols } from '../excel/MakeColumns';
// import { SheetJSFT } from '../excel/types';
import XLSX from 'xlsx';
import {
	Button, 
	// Checkbox,
	// Form,
	Segment,
	// Icon,
	// Table
} from 'semantic-ui-react';
import LabelFiltering from '../components/LabelFiltering';
// import {
	// Redirect 
// } from 'react-router-dom';

class Upload extends React.Component{
	constructor(props){
		super(props)
		this.state = {
			file: '',
			data: [],
			cols: [],
			release_date: null,
			current_label: null,
			api_response: {},
		}
    this.postAlbum = this.postAlbum.bind(this);
    this.handleFile = this.handleFile.bind(this);
    this.updateLabel = this.updateLabel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.updateReleaseDate = this.updateReleaseDate.bind(this);
	}
	
	handleChange(e) {
    const files = e.target.files;
    if (files && files[0]) this.setState({ file: files[0] }, () => {
			console.log(this.state);
			console.log('past handling files')
		});
  }
	
	// Moved over from the componenent
	handleFile() {
		
		if(!this.state.release_date){
			alert("Please enter a release date to upload metadata!");
			return;
		}
		if(!this.state.current_label){
			alert("Please select a label to upload metadata!");
			return;
		}
		
    /* Boilerplate to set up FileReader */
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;
 
    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array', bookVBA : true });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_json(ws);
      /* Update state */
      this.setState({ data: data, cols: make_cols(ws['!ref']) }, () => {
				this.postAlbum()
      });
    };
 
    if (rABS) {
      reader.readAsBinaryString(this.state.file);
    } else {
      reader.readAsArrayBuffer(this.state.file);
    };
	}
	
	updateReleaseDate = (event, {name, value}) => {
		console.log('Setting release date as: ' + value);
		this.setState({ release_date: value })
	}
	
	updateLabel = (event, {name, value}) => {
		if(event){
			const labelId = event.value;
			this.setState({
				current_label: labelId,
			}, () => { console.log(this.state); })
		}else{	// On clear, set up w/ 0
			this.setState({
				current_label: 0,
			}, () => { console.log(this.state); })
		}
	}
	
	postAlbum(){
		if(!this.state.cols.length){
			alert('Upload failed! Please use a valid format.');
			return;
		}
		const postData = {
			album: this.state.data,
			label: this.state.current_label,
			release_date: this.state.release_date,
		}
		axios.post(config.get('api_url') + 'upload/album', postData).then(res => {
			if(res.data){
				if(res.success && res.success === false){
					alert('Upload failed! Please use a valid format.');
				}
				this.setState({
					api_response: res.data
				})
			}
		})
	}
	
	render(){
		
		// Lines like this are why I hate JS. 
		var resultsMarkup = Object.keys(this.state.api_response).length === 0 && this.state.api_response.constructor === Object ? '' : 
			
			<div>
				<h3 style={{textTransform: 'uppercase', color: '#413a5f'}}>Complete!</h3>
				<p style={{marginBottom: 5}}><strong>Artists Created:</strong> {this.state.api_response.artists_created || '0'}</p>
				<p style={{marginBottom: 5}}><strong>Albums Created:</strong> {this.state.api_response.albums_created || '0'}</p>
				<p style={{marginBottom: 5}}><strong>Tracks Created:</strong> {this.state.api_response.tracks_added || '0'}</p>
				<p style={{marginBottom: 5}}><strong>Tracks Skipped:</strong> {this.state.api_response.tracks_skipped || '0'}</p>
			</div>
		
		return(
			<Segment id="spins" className="page grid-container">
				<div className="grid-x grid-margin-x">
					<PageHeader
						h1="Upload Album" 
						link="/upload"
						iconName="upload"
						instructions="Attach an Excel Metadata Sheet below to upload an album to the 800PGR database."
					/>
					
					<div className='cell'>
						
						{/* RELEASE DATE AND LABEL ASSIGNMENT -> NOT IN METADATA, BUT YOU NEED THEM! */}
						<div className='grid-x'>
							<div className='cell large-8'>
								<label><strong>Release Date (required)</strong></label>
								<DateFiltering 
									placeholder="xxxx-xx-xx"
									onChange={ this.updateReleaseDate }
									value={ this.state.release_date }
									style={ {width: '100%'} }
								/>
								<br />
								
								<label><strong>Label (required)</strong></label>
								<LabelFiltering 
									activeLabel={ this.state.current_label }
									onChange={ this.updateLabel }
								/>
								
							{/* <br /> */}
							{/* <label htmlFor="file">Use the 'Browse' button to find the file on your computer. Then, click 'Upload Metadata' to upload the metadata into the system.</label> */}
							{/* <br /> */}
							<br />
							</div>
						</div>
						
						{/* Hardcoded accepted types. This is NOT how the example does it, but that still allowed images... see https://stackoverflow.com/questions/11832930/html-input-file-accept-attribute-file-type-csv */}
						<input type="file" className="form-control" id="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={this.handleChange}/>
						
						<br />
						<br />
						
						<Button primary type='submit' onClick={this.handleFile}>Upload Metadata</Button>
					</div>

					<div className='cell'>
						<br />
						<br />
						{ resultsMarkup }
					</div>

				</div>
			</Segment>
		)
	}
}

export default Upload;