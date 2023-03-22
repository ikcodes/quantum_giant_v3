import React from 'react'
import Select from 'react-select-virtualized';

const siriusChannels = [
  { key: 0, value: 0, label: "All Channels"},
  { key: 168, value: 168, label: 'Canada Laughs' },
  { key: 94, value: 94, label: "Comedy Greats" },
  { key: 97, value: 97, label: "Jeff and Larry" },
  { key: 78, value: 78, label: "Kids Place Live" },
  { key: 96, value: 96, label: "Kevin Hart's LOL" },
  { key: 98, value: 98, label: "Laugh USA" },
  { key: 93, value: 93, label: "Netflix Is A Joke" },
  { key: 99, value: 99, label: "Raw Dog" },
  { key: 104, value: 104, label: "Comedy Classics" },
  { key: 105, value: 105, label: "She's So Funny" },
  { key: 16, value: 16, label: "The Blend" },
  { key: 741, value: 741, label: "The Village" },
  { key: 782, value: 782, label: "Christmas Spirit " }
]

const ChannelFiltering = (props) => {
  return(
    <Select 
      value={ siriusChannels.filter(option => option.value === props.activeChannel)}
      options={ siriusChannels }
      onChange={ props.onChange }
    />
  )
}

export default ChannelFiltering;