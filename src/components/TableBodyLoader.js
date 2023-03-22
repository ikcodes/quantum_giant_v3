import React from 'react';
import {
	Table,
	Loader
} from 'semantic-ui-react';

const TableBodyLoader = (props) => {
	let loaderMargin = props.margin ? props.margin : '45px 0';
	let loaderStyle = {width: '100%', margin: loaderMargin};
	return(
		<Table.Row style={ props.loading ? {} : { display: 'none' }}>
			<Table.Cell colSpan={props.cols}>
				<Loader active={ props.loading } indeterminate={ props.slow ? true : false } inline={ 'centered' } size='large' style={loaderStyle} >
					{ props.message || "Loading..." }
				</Loader>
			</Table.Cell>
		</Table.Row>
	)
}
export default TableBodyLoader;