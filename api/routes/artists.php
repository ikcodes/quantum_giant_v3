<?php /*=============================//

/api/artists/{action}

=====================================*/

if($ACTION == 'load'){	// Letter is optional. 
	$letter = !empty($_POST['letter']) ? $_POST['letter'] : 'a';
	$artists = getArtistsByLetter($letter);
	$letters = range('a', 'z');
	$letters[] = '#'; // Special Chars!
	$res = array(
		'artists' => $artists,
		'letters' => $letters,
		'breadcrumbs_1' => 'All Artists (A-Z)',
		'breadcrumbs_2' => 'a',
	);
}

if($ACTION == 'artists-by-letter'){
	$letter = trim($_POST['letter']);
	if(!empty($letter)){
		$artists = getArtistsByLetterForRoster($letter);
		$res = array(
			'artists' => $artists,
		);
	}
}

// 800PGR WEBSITE LOOKUP DEPENDS ON THIS!
//=========================================
if($ACTION == 'artists-by-phrase'){	
	$phrase = trim($_POST['phrase']);
	if(!empty($phrase)){
		$am = new Model('our_artists');
		$wc = 'artist_name LIKE "%'.$phrase.'%"';
		$like_artists = $am->get_items(array(
			'where' => $wc,
			'order' => 'artist_name ASC',
		));	// No filtering or alternate spellings!
		$res = array(
			'artists' => $like_artists,
		);
	}
}

if($ACTION == 'load-for-dropdown'){
	$am = new Model('our_artists');
	$dropdown_artists = $am->get_items(array(
		'order' => 'artist_name ASC',
		'where' => 'artist_name IS NOT NULL',
	));	// No filtering or alternate spellings!
	$res = array(
		'artists' => $dropdown_artists,
	);
}

if($ACTION == 'edit-artist'){
	$artist_id = $_POST['artist_id'];
	$am = new Model('our_artists', 'artist_id');
	$am->load($artist_id);
	$artist = $am->data;
	$alt_spellings = $am->db->fetch("SELECT artist_alt_spelling FROM our_artists__alt_spelling WHERE artist_id = ?", array($artist['artist_id']));
	$artist['alt_spellings'] = array();
	foreach($alt_spellings as $i => $alt){
		$artist['alt_spellings'][$i] = $alt['artist_alt_spelling'];
	}
	$res = array(
		'artist' => $artist,
	);
}

// CAN BE UPDATE * OR * ADD!
if($ACTION == 'update-artist'){
	$am = new Model('our_artists', 'artist_id');
	if( $_POST['add'] == false ){	// UPDATE
		$am->load($_POST['artist_id']);
		$update_data = array(
			'artist_name' => trim($_POST['artist_name']),
			'artist_url' => trim($_POST['artist_url']),
		);
		$am->update($update_data);
		manageAltSpellings($_POST);
		$res = $_POST;
	}
	else{	// ADD
		
		if(!empty(trim($_POST['artist_name']))){
			$args = array(
				'artist_name' => trim($_POST['artist_name']),
			);
			
			// Great! Now we can manage alt spellings with our new ID.
			$new_id = $am->insert($args);
			$args['artist_id'] = $new_id;
			$args['alt_spellings'] = trim($_POST['alt_spellings']);
			$args['artist_url'] = trim($_POST['artist_url']);
			manageAltSpellings($args);
			
			$res = $args;
		}
		else{
			$res = array();	// No actual artist name passed. No bueno.
		}
	}
}

if($ACTION == 'artist-name-by-id'){
	if(!empty($_POST['id'])){
		$artist_id = intval($_POST['id']);
		$am = new Model('our_artists', 'artist_id');
		$artist_name = $am->db->fetch_value("SELECT artist_name FROM our_artists WHERE artist_id=?", array($artist_id));
		$res = array(
			'id' => $artist_id,
			'name' => $artist_name,
		);
	}
}

if($ACTION == 'delete'){
	if(!empty($_POST['artist_id'])){
		$artist_id = intval($_POST['artist_id']);
		$row_count_deleted = deleteArtist($artist_id);
		$res = array(
			'success' => $row_count_deleted >= 1 ? true : false,
			'instructions' => 'Delete operation concluded. Success Count: '.$row_count_deleted,
		);
	}
}