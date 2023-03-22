import React from 'react';
import axios from 'axios';
// import { Link } from 'react-router-dom';
import config from 'react-global-configuration';
import { 
	Button,
	Table,
	// Icon,
	// Menu,
	// Popup,
	// Segment,
	// Tab,
} from 'semantic-ui-react';

import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import AddButton from '../../components/AddButton';
import PageHeader from '../../components/PageHeader';
import TableBodyLoader from '../../components/TableBodyLoader';
import TableActionButton from '../../components/TableActionButton';


//=======================================
//					ARTIST: LIST VIEW
//=======================================
class LabelList extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			labels: [],
			breadcrumbs_1: '',
			instructions: 'View Label Summaries, view Albums per Label, or edit Label info by using the table below.',
		}
		
		this.deleteLabel = this.deleteLabel.bind(this);
	}
	
  componentDidMount(){
		axios.get(config.get('api_url')+'label/list').then(res => {
			this.setState({
				labels: res.data.labels,
			},
		)});
	}
	
		
	// NEW DELETE (with custom return confirm)
	deleteLabel(label_id, label_name){
		confirmAlert({
			title: 'Deleting '+label_name+'',
			message: 'Really delete '+label_name+'?',
			buttons: [
				{
					label: 'Yes',
					onClick: () => {
						const deleteUrl = config.get('api_url') + 'label/delete';
						const postData = {
							label_id: label_id,
						}
						axios.post(deleteUrl, postData).then(res => {
							if(res.data.success >= 1){
								window.location.reload();
							}else{
								alert("There was a problem deleting the label. Please refresh the page and try again.");
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
	
	render(){
		return(
			<div className="grid-x grid-margin-x">
					<PageHeader
						h1='Labels'
						// link={ '/label?label_id='+this.state.label_id }
						link={'/'}
						instructions={ this.state.instructions }
						iconName='ticket'
						// breadcrumbs_1={ this.state.label_name || '' }
						// breadcrumbs_1_url={ this.state.breadcrumbs_1_url || null }
					/>
					
					{/* ADD ARTIST */}
					<AddButton link='/label/edit/add' text="Add New Label" />
					
						{/* RESULTS TABLE */}
						<div className="cell small-12">
						<div className="grid-x">
							<div className="cell large-8">
								<Table celled striped unstackable>
									
									{/* TABLE HEADER & NAVIGATION */}
									<Table.Header>
										<Table.Row>
											<Table.HeaderCell>Labels</Table.HeaderCell>
											<Table.HeaderCell>Summary</Table.HeaderCell>
											<Table.HeaderCell>Albums</Table.HeaderCell>
											<Table.HeaderCell>Actions</Table.HeaderCell>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										<TableBodyLoader loading={ this.state.loading } cols={2} message="Loading Labels..." slow={false} />
										{ this.state.labels.map( (label, index) => {
											return (
												<Table.Row key={ index }>
													<Table.Cell>{ label['label_name'] }</Table.Cell>
													<Table.Cell collapsing style={{ textAlign:'center' }}>
														<Button.Group basic size='small'>
															<TableActionButton link={ '/summary/label?label_id='+label['label_id'] } actionName='View Label Summary' actionIcon='chart pie' />
														</Button.Group>
													</Table.Cell>
													<Table.Cell collapsing style={{ textAlign:'center' }}>
														<Button.Group basic size='small'>
															<TableActionButton link={ '/albums/label/'+label['label_id'] } actionName='View All Albums' actionIcon='clone' />
														</Button.Group>									
													</Table.Cell>
													<Table.Cell collapsing>
														<Button.Group basic size='small'>
															<TableActionButton link={'/label/edit/'+label['label_id']} actionName='Edit Label' actionIcon='edit'/>
															<TableActionButton link={false} actionName={ 'Delete Label' } actionIcon='trash' onClick={ ()=> { this.deleteLabel(label['label_id'], label['label_name'])}}/>
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
			// <div>
			// 	<div className="grid-x grid-margin-x">

			// 		{/* PAGE HEADER + BREADCRUMBS */}
			// 		<PageHeader 
			// 			h1="XM Labels"
			// 			link="/labels"
			// 			iconName="rss"
			// 			breadcrumbs_1={this.state.breadcrumbs_1}
			// 			breadcrumbs_2={this.state.breadcrumbs_2}
			// 			instructions={this.state.instructions}
			// 		/>
					
			// 		<div className='cell large-12' style={{marginBottom: 15}}>
			// 			<p className='instructions'>Use this tool to <strong>modify which labels are tracked</strong> on SiriusXM.</p>
			// 		</div>
			// 	</div>
				
			// 	{/* ADD ARTIST */}
			// 	<AddButton link='/labels/edit/add' text="Track New Label" />

			// 	<div className='grid-x grid-margin-x'>
					
			// 		{/* LIST OF ARTISTS */}
			// 		<div className="cell large-8 table-scroll">
			// 			<Table celled striped unstackable>
							
			// 				{/* TABLE HEADER & NAVIGATION */}
			// 				<Table.Header>
			// 					<Table.Row>
			// 						<Table.HeaderCell collapsing>Station</Table.HeaderCell>
			// 						<Table.HeaderCell>Label Name</Table.HeaderCell>
			// 						<Table.HeaderCell collapsing>Broadcast</Table.HeaderCell>
			// 						<Table.HeaderCell collapsing style={{textAlign:'left'}}>Top Spinners</Table.HeaderCell>
			// 						<Table.HeaderCell collapsing style={{textAlign:'left'}}>Recent Spins</Table.HeaderCell>
			// 						<Table.HeaderCell collapsing style={{textAlign:'left'}} colSpan={2}>Actions</Table.HeaderCell>
			// 					</Table.Row>
			// 				</Table.Header>
							
			// 				{/* TABLE BODY */}
			// 				<Table.Body>
			// 					{ this.state.labels.map( label => {
			// 						const labelId = label['label_id'];
			// 						const labelHref = '/labels/edit/'+labelId;
			// 						const currSpinsHref  = '/spins?label='+labelId+'&start_date='+this.state.currentDate;
			// 						const topSpinnersHref = '/top-spinners?label='+labelId+'&go=1';
			// 						const labelTypeText = label['web'] === "1" ? 'Web' : 'XM';	// Int in DB, but string comes back
			// 						return (
			// 							<Table.Row key={ labelId }>
			// 								<Table.Cell>{ label['label_id'] }</Table.Cell>
			// 								<Table.Cell>{ label['label_name'] }</Table.Cell>
			// 								<Table.Cell collapsing style={{textAlign: 'center'}}>{ labelTypeText }</Table.Cell>
			// 								<Table.Cell collapsing style={{textAlign: 'center'}}>
			// 									<Button.Group basic size='small'>
			// 										<TableActionButton link={topSpinnersHref} actionName={ 'View Top Spinners on ' + label['label_name'] } actionIcon='sort amount down'/>
			// 									</Button.Group>
			// 								</Table.Cell>
			// 								<Table.Cell collapsing style={{textAlign: 'center'}}>
			// 									<Button.Group basic size='small'>
			// 										<TableActionButton link={currSpinsHref} actionName={ 'View Recent Spins on ' + label['label_name'] } actionIcon='list'/>
			// 									</Button.Group>
			// 								</Table.Cell>
			// 								<Table.Cell collapsing>
			// 									<Button.Group basic size='small'>
			// 										<TableActionButton link={labelHref} actionName='Edit Label' actionIcon='edit'/>
			// 										<TableActionButton link={false} actionName={ 'Delete Label' } actionIcon='trash' onClick={ ()=> { this.deleteLabel(label['label_id'], label['label_name'])}}/>
			// 									</Button.Group>
			// 								</Table.Cell>
			// 							</Table.Row>
			// 						);
			// 					})}
			// 				</Table.Body>
			// 			</Table>
			// 		</div>
			// 	</div>
			// </div>
		);
	}
}

 export default LabelList;