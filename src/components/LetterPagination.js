import React from "react";
import { Icon, Menu, Table } from "semantic-ui-react";

export default function LetterPagination(props) {
  return (
    <Table.Row>
      <Table.HeaderCell textAlign='center' colSpan='3' id='artistsLetterMenu'>
        <Menu compact secondary size='mini'>
          <Menu.Item as='a' icon onClick={props.letterBackward}>
            <Icon name='chevron left' />
          </Menu.Item>
          {props.current_letters.map((letter) => {
            return (
              <Menu.Item
                active={props.current_letter === letter}
                onClick={props.onClick(letter)}
                key={letter}
                as='a'
              >
                {letter}
              </Menu.Item>
            );
          })}
          <Menu.Item as='a' icon onClick={props.letterForward}>
            <Icon name='chevron right' />
          </Menu.Item>
        </Menu>
      </Table.HeaderCell>
    </Table.Row>
  );
}
