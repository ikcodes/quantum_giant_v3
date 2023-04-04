import React from "react";
import { Link } from "react-router-dom";
import { Popup, Button } from "semantic-ui-react";

const TableActionButton = (props) => {
  if (props.link === false) {
    return (
      <div onClick={props.onClick}>
        <Popup
          content={props.actionName}
          offset='0, 1px'
          position='left center'
          trigger={
            <Button className={props.buttonClass} circular icon={props.actionIcon} size='mini' />
          }
        />
      </div>
    );
  } else {
    return (
      <Link to={props.link}>
        <Popup
          content={props.actionName}
          offset='0, 1px'
          position='left center'
          trigger={
            <Button className={props.buttonClass} circular icon={props.actionIcon} size='mini' />
          }
        />
      </Link>
    );
  }
};

export default TableActionButton;
