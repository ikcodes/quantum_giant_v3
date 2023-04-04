import React from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { Icon, Menu, Sidebar } from "semantic-ui-react";

function UserNav(props) {
  // Set active state in nav
  let urlChunks = useLocation().pathname.split("/");
  let activeNavItem = urlChunks[1]; // 0-index == ""

  // History for user navigation
  let history = useHistory();

  return (
    <Sidebar as={Menu} animation='overlay' icon='labeled' id='nav' vertical visible width='thin'>
      <Link to='/home/' onClick={() => history.push("/")}>
        <Menu.Item as='div' id='navLogoContainer' name='home' active={activeNavItem === "home"}>
          <img alt='Quantum Giant Logo' id='navLogo' src='/images/800pgr-logo.png' />
        </Menu.Item>
      </Link>
      <Link to='/artists' onClick={() => history.push("/artists")}>
        <Menu.Item
          as='p'
          name='artists'
          active={activeNavItem === "artists" || activeNavItem === "artist-summary"}
        >
          <Icon className='nav-icon' name='users' />
          <span className='nav-title'>Artists</span>
        </Menu.Item>
      </Link>
      <Link to='/albums' onClick={() => history.push("/albums")}>
        <Menu.Item as='p' name='albums' active={activeNavItem === "albums"}>
          <Icon className='nav-icon' name='clone' />
          <span className='nav-title'>Albums</span>
        </Menu.Item>
      </Link>
      <Link to='/tracks' onClick={() => history.push("/tracks")}>
        <Menu.Item as='p' name='tracks' active={activeNavItem === "tracks"}>
          <Icon className='nav-icon' name='list' />
          <span className='nav-title'>Tracks</span>
        </Menu.Item>
      </Link>
      <Link to='/label'>
        <Menu.Item as='p' name='label' active={activeNavItem === "label"}>
          <Icon className='nav-icon' name='ticket' />
          <span className='nav-title'>Labels</span>
        </Menu.Item>
      </Link>
      <Link to='/spin-summary'>
        <Menu.Item
          as='p'
          name='spin-summary'
          active={
            activeNavItem === "spin-summary" ||
            activeNavItem === "spins" ||
            activeNavItem === "summary"
          }
        >
          <Icon className='nav-icon' name='headphones' />
          <span className='nav-title'>Spins</span>
        </Menu.Item>
      </Link>
      <Link to='/top-spinners'>
        <Menu.Item as='p' name='top-spinners' active={activeNavItem === "top-spinners"}>
          <Icon className='nav-icon' name='chart bar' />
          <span className='nav-title nav-title-condense'>Top Spinners</span>
        </Menu.Item>
      </Link>
      <Link to='/top-albums'>
        <Menu.Item as='p' name='top-albums' active={activeNavItem === "top-albums"}>
          <Icon className='nav-icon' name='chart line' />
          <span className='nav-title nav-title-condense'>Top Albums</span>
        </Menu.Item>
      </Link>
      <Link to='/channels' onClick={() => history.push("/channels")}>
        <Menu.Item as='p' name='channels' active={activeNavItem === "channels"}>
          <Icon className='nav-icon' name='rss' />
          <span className='nav-title nav-title-condense'>XM Channels</span>
        </Menu.Item>
      </Link>
      <Link to='/commercials'>
        <Menu.Item as='p' name='trash' active={activeNavItem === "commercials"}>
          <Icon className='nav-icon' name='ban' />
          <span className='nav-title nav-title-condense'>Commercials</span>
        </Menu.Item>
      </Link>
      <Link to='/search'>
        <Menu.Item as='p' name='search' active={activeNavItem === "search"}>
          <Icon className='nav-icon' name='search' />
          <span className='nav-title'>Search</span>
        </Menu.Item>
      </Link>
      <Link to='/upload'>
        <Menu.Item as='p' name='upload' active={activeNavItem === "upload"}>
          <Icon className='nav-icon' name='upload' />
          <span className='nav-title'>Upload</span>
        </Menu.Item>
      </Link>
      <Link to='/filemaker'>
        <Menu.Item as='p' name='filemaker' active={activeNavItem === "filemaker"}>
          <Icon className='nav-icon' name='file' />
          <span className='nav-title'>Filemaker</span>
        </Menu.Item>
      </Link>
    </Sidebar>
  );
}

export default UserNav;
