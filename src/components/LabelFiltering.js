import React from "react";
import Select from "react-select-virtualized";

const ourLabels = [
  { key: 0, value: 0, label: "NO LABEL" },
  { key: 1, value: 1, label: "800 Pound Gorilla Records" },
  { key: 11, value: 11, label: "Bad Password" },
  { key: 2, value: 2, label: "Clown Jewels" },
  { key: 3, value: 3, label: "Laugh Out Loud" },
  { key: 4, value: 4, label: "Entre Nos" },
  { key: 5, value: 5, label: "TLB Records" },
  { key: 6, value: 6, label: "8 Pound Gorilla Records" },
  { key: 7, value: 7, label: "Cruzen Street" },
  { key: 8, value: 8, label: "Slimstyle" },
  { key: 9, value: 9, label: "Drishti" },
];

const LabelFiltering = (props) => {
  return (
    <Select
      value={ourLabels.filter((option) => option.value === props.activeLabel)}
      options={ourLabels}
      onChange={props.onChange}
      style={props.style || {}}
    />
  );
};

export default LabelFiltering;
