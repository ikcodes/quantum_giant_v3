<?php // MOVED API FUNCTIONS INTO HERE

//=================================
//				ARTIST FUNCTIONS
//=================================
function getArtistsByLetter($letter){
	$artist_model = new Model('our_artists');
	$like_sql = ($letter == '#') ? "REGEXP '^[^A-Za-z]'" : 'LIKE "'.trim($letter).'%"';
	$artists = $artist_model->get_items(array(
		'where' => 'artist_name '.$like_sql,
		'order' => 'artist_name ASC',
	));
	return $artists;
}

function getArtistsByLetterForRoster($letter){
	$artist_model = new Model('our_artists');
	$like_sql = ($letter == '#') ? "REGEXP '^[^A-Za-z]'" : 'LIKE "'.trim($letter).'%"';
	$where_sql = 'artist_name '.$like_sql . ' AND LENGTH(artist_name) < 50';
	// die($where_sql);
	$artists = $artist_model->get_items(array(
		'where' => $where_sql,
		'order' => 'artist_name ASC',
	));
	return $artists;
}

function manageAltSpellings($args){
	$am = new Model('our_artists__alt_spelling', 'artist_id');
	$ok = !empty($args['artist_id']);
	$artist_id = intval($args['artist_id']);
	$artist_name = $args['artist_name'];
	$alt_spellings = !empty($args['alt_spellings']) ? $args['alt_spellings'] : array();
	
	if($ok){	// Insert the new alt spellings. First, delete all associated.
		$am->db->delete("DELETE FROM our_artists__alt_spelling WHERE artist_id=?", array($artist_id));
		foreach($alt_spellings as $alt){
			if(!empty($alt)){	// Blank string in UI == delete
				$sql = 'INSERT INTO our_artists__alt_spelling (artist_id, artist_name, artist_alt_spelling) VALUES (?, ?, ?)';
				$params = array(
					'artist_id' => $artist_id,
					'artist_name' => $artist_name,
					'artist_alt_spelling' => trim($alt),
				);
				$am->db->insert($sql, $params);
			}
		}
	}else{
		die("Not ok on alt spellings.");
	}
}

function deleteArtist($artist_id){
	$am = new Model('our_artists', 'artist_id');
	$am->load($artist_id);
	$row_ct = $am->delete();
	
	// Unearth connected records.
	$args = array($artist_id);
	$track_ids = $am->db->fetch('SELECT track_gid FROM our_tracks WHERE artist_id=?', $args);
	$album_ids = $am->db->fetch('SELECT album_id FROM artist_x_album WHERE artist_id=?', $args);
	
	if(!empty($track_ids) or !empty($album_ids)){
		
		// Get rid of those records.
		foreach($track_ids as $track){
			$row_ct += $am->db->delete('DELETE FROM our_tracks WHERE track_gid=?', array($track['track_gid']));
			$row_ct += $am->db->delete('DELETE FROM our_tracks__alt_spelling WHERE track_gid=?', array($track['track_gid']));
		}
		foreach($album_ids as $album){
			$row_ct += $am->db->delete('DELETE FROM our_albums WHERE album_id=?', array($album['album_id']));
			$row_ct += $am->db->delete('DELETE FROM our_albums__alt_release_date WHERE album_id=?', array($album['album_id']));
		}
	}
	
	// Finally, delete main assoc records.
	$row_ct += $am->db->delete('DELETE FROM artist_x_album WHERE artist_id=?', $args);
	$row_ct += $am->db->delete('DELETE FROM our_artists__alt_spelling WHERE artist_id=?', $args);
	return $row_ct;
}




//=================================
//				ALBUM FUNCTIONS
//=================================
function getAlbumsByArtist($artist_id){
	$args = array(
		'from' => 'our_albums a INNER JOIN artist_x_album ax ON a.album_id=ax.album_id',
		'where' => 'ax.artist_id=?',
		'order' => 'a.album_title',
		'params' => array($artist_id),
	);
	$albums = getAlbums($args);
	return $albums;
}

function getArtistInfo($artist_id){
	$am = new Model('our_artists', 'artist_id');
	$am->load($artist_id);
	return $am->data;
}

function getLabelInfo($label_id){
	$lm = new Model('labels', 'label_id');
	$lm->load($label_id);
	return $lm->data;
}

function getLabelName($label_id){
	$lm = new Model('labels', 'label_id');
	$lm->load($label_id);
	$label_name = !empty($lm->data['label_name']) ? $lm->data['label_name'] : 'No Label!';
	return $label_name;
}

function getAlbumsByLetter($letter){
	$like_sql = ($letter == '#') ? "REGEXP '^[^A-Za-z]'" : 'LIKE "'.trim($letter).'%"';
	$args = array(
		'where' => 'album_title '.$like_sql,
		'order' => 'album_title',
	);
	return getAlbums($args);
}

function getAlbumsByLabel($label_id){
	$args = array(
		'where' => 'label_id='.$label_id,
		'order' => 'album_title',
	);
	return getAlbums($args);
}

function getAlbums($args){
	$am = new Model('our_albums');
	$albums = $am->get_items($args);
	if(!empty($albums)){
		foreach($albums as &$album){
			
			// Get artist name
			$artist_nm_sql = 'SELECT a.artist_name, a.artist_id FROM our_artists a LEFT JOIN artist_x_album ax ON ax.artist_id=a.artist_id WHERE ax.album_id=?';
			if($album['album_is_compilation'] == 1){	// List 'compilation' if Aritst:Album is not 1:1.
				$album['artist']['artist_name'] = "Compilation";
				$album['artist']['artists'] = $am->db->fetch($artist_nm_sql, array($album['album_id']));	// Find all the related artists.
			}else{
				$primary_artist = $am->db->fetch_row($artist_nm_sql, array($album['album_id']));
				if($primary_artist){
					$album['artist'] = $primary_artist;
				}else{
					$album['artist'] = 'Unknown';
				}
			}
			
			// Get label name
			$label_nm_sql = 'SELECT label_name FROM labels WHERE label_id=?';
			$label_nm = $am->db->fetch_value($label_nm_sql, array($album['label_id']));
			$album['label_name'] = $label_nm;
		}
	}
	return $albums;
}

function getAlbum($album_id){
	$am = new Model('our_albums', 'album_id');
	$am->load($album_id);
	$album = $am->data;
	$single = boolval($album['album_is_single']);	// Convert to BOOL for frontend.
	$album['album_is_single'] = $single;
	
	if(intval($album['album_is_compilation']) === 0){ // This assumes only one artist per album.
		$sql = "SELECT a.artist_name, a.artist_id 
						FROM our_artists a 
							INNER JOIN artist_x_album ax 
							ON ax.artist_id=a.artist_id 
						WHERE ax.album_id=?";
		
		$data = $am->db->fetch_row($sql, array( $album_id ));
		$album['artist_id'] = $data['artist_id'];
		$album['artist_name'] = $data['artist_name'];
		$album['album_is_compilation'] = false;
	}else{
		$album['artist_id'] = 0;
		$album['artist_name'] = 'Various Artists';
		$album['album_is_compilation'] = true;
	}
	
	// Get alt spellings
	$alt_sql = "SELECT album_alt_release_date FROM our_albums__alt_release_date WHERE album_id = ?";
	$alt_spellings = $am->db->fetch($alt_sql, array($album['album_id']));
	$album['alt_release_dates'] = array();
	foreach($alt_spellings as $i => $alt){
		$album['alt_release_dates'][$i] = $alt['album_alt_release_date'];
	}
	
	// $alt_sql = "SELECT * FROM our_albums__alt_release_date WHERE album_id=?";
	// $album['alt_release_dates'] = $am->db->fetch($alt_sql, array($album['album_id']));
	
	return $album;
}


function createAlbum($album){	// $album 1:1 this.state.album
	$am = new Model('our_albums', 'album_id');
	$insert_data = parameterizeAlbum($album);
	$album_id = $am->insert($insert_data);
	updateAxA($album_id, $album['artist_id']);	// USE ALBUM! This is from the post, NOT PARAMATERIZE DATA.
	return $album_id;
}

function updateAlbum($album){	// $album 1:1 this.state.album
	$am = new Model('our_albums', 'album_id');
	$update_data = parameterizeAlbum($album);
	$album_id = intval($album['album_id']);
	$am->load($album_id);
	$am->update($update_data);
	updateAxA($album_id, $album['artist_id']);
	return $album_id;
}

function updateAxA($album_id, $artist_id = 0){	// Bridge table update
	$axm = new Model('artist_x_album');
	$axm_sql = 'DELETE FROM artist_x_album WHERE album_id=?';
	$axm->db->delete( $axm_sql, array( $album_id ));
	if($artist_id !== 0){	// Only insert record if this album is NOT a compilation
		$axm_new_sql = 'INSERT INTO artist_x_album(album_id, artist_id) VALUES (?, ?)';
		$axm->db->insert( $axm_new_sql, array( $album_id, $artist_id ));
	}
}

function parameterizeAlbum($album){	// THESE FIELDS ONLY UNLESS YOU ALTER THE TABLE! ARTIST ID STUFF COMES FROM A_X_A
	$data = array(
		'album_title' => trim($album['album_title']),
		'album_is_compilation' => $album['album_is_compilation'] ? 1 : 0,
		'album_is_single' => $album['album_is_single'] ? 1 : 0,
		'album_release_date' => isset($album['album_release_date']) ? trim($album['album_release_date']) : date('Y-m-d'),	// Ho, boy...
		'album_upc' => !empty(trim($album['album_upc'])) ? trim($album['album_upc']) : "",
		'album_cat_num' => !empty(trim($album['album_cat_num'])) ? trim($album['album_cat_num']) : "",
		'label_id' => !empty(trim($album['label_id'])) ? trim($album['label_id']) : "",
	);
	return $data;
}


function manageAltReleaseDates($args){
	$am = new Model('our_albums__alt_release_date', 'album_id');
	$ok = !empty($args['album_id']);
	$album_id = intval($args['album_id']);
	$album_title = $args['album_title'];
	$alt_platform = !empty($args['album_alt_platform']) ? $args['album_alt_platform'] : '';
	$alt_release_dates = !empty($args['alt_release_dates']) ? $args['alt_release_dates'] : array();
	
	if($ok){	// First, delete all associated alt dates - then, insert the new alt date.
		$am->db->delete("DELETE FROM our_albums__alt_release_date WHERE album_id=?", array($album_id));
		foreach($alt_release_dates as $alt){
			if(!empty($alt)){	// Blank string in UI == delete
				$alt_date = date('Y-m-d', strtotime(trim($alt)));
				$sql = 'INSERT INTO our_albums__alt_release_date (album_id, album_title, album_alt_release_date, album_alt_platform) VALUES (?, ?, ?, ?)';
				$params = array(
					'album_id' => $album_id,
					'album_title' => $album_title,
					'album_alt_release_date' => $alt_date,
					'album_alt_platform' => $alt_platform,
				);
				$id = $am->db->insert($sql, $params);
			}
		}
	}else{
		var_dump($args);
		die("Not ok on RELEASE DATES!");
	}
}


function deleteAlbum($album_id){
	$am = new Model('our_albums', 'album_id');
	$am->load($album_id);
	$row_ct = $am->delete();
	$args = array($album_id);
	
	// Unearth connected records.
	$track_ids = $am->db->fetch('SELECT track_gid FROM our_tracks WHERE album_id=?', $args);
	
	if(!empty($track_ids)){
		
		// Get rid of those records.
		foreach($track_ids as $track){
			$am->db->delete('DELETE FROM our_tracks WHERE track_gid=?', array($track['track_gid']));
			$am->db->delete('DELETE FROM our_tracks__alt_spelling WHERE track_gid=?', array($track['track_gid']));
		}
		
		// Finally, delete main assoc records.
		$am->db->delete('DELETE FROM artist_x_album WHERE album_id=?', $args);
	}
	return $row_ct;
}
