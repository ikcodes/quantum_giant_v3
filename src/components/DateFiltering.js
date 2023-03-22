import React from 'react';
import { DateInput } from 'semantic-ui-calendar-react';

const DateFiltering = (props) => (
	<div className="field">
		<DateInput
			autoComplete="off"
			animation="none"
			dateFormat="YYYY-MM-DD"
			name="start_date"
			placeholder={ props.placeholder || '' }
			value={ props.value || ''}
			iconPosition="left"
			onChange={ props.onChange }
			style={ props.style || {} }
		/>
	</div>
)

export default DateFiltering;