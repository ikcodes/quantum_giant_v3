<?php /*=============================//

Routes for /src/pages/TrackPage.js

=====================================*/
$am = new Model('our_albums', 'album_id');	// Keep these up here!!! Global vars don't work down below.
$tm = new Model('our_tracks', 'track_gid');

if($ACTION == 'load'){
	
	/*
	Expect one of the following:
	album_id (preferred)	=>	Load tracks by album
	artist_id (still ok)	=>	Load all tracks by an artist, sorted by album
	letter (worst)				=>	Load all tracks given a letter.
	
	Return:
	tracks: array of tracks (even if blank)
	letters: a-z plus #
	
	*/
	if(!empty($_POST['album_id']))
	{
		$tracks = getTracksByAlbum(intval($_POST['album_id']));
		$bc1 = $tracks[0]['album_is_compilation'] ? 'Various Artists' : $tracks[0]['artist_name'];
		$bc2 = $tracks[0]['album_title'];
	}
	elseif(!empty($_POST['artist_id']))
	{
		$tracks = getTracksByArtist(intval($_POST['artist_id']));
		$bc1 = $tracks[0]['artist_name'];
		$bc2 = "All Tracks";
	}
	else{
		$tracks = !empty($_POST['letter']) ? getTracksByLetter($_POST['letter']) : $tracks = getTracksByLetter('a');
		$bc1 = 'All Tracks (A-Z)';
		$bc2 = 'a';
	}
	$letters = range('a', 'z'); $letters[] = '#';
	$res = array(
		'tracks' => $tracks,
		'letters' => $letters,
		'breadcrumbs_1' => $bc1,
		'breadcrumbs_2' => $bc2 ? $bc2 : NULL,
	);
}

if($ACTION == 'load-track'){
	if(!empty($_POST['track_gid'])){
		$gid = intval($_POST['track_gid']);
		$track = getTrack($gid);
		$res = array(
			'track' => $track,
		);
	}else{
		// var_dump($_POST);
		die("No GID!");
	}
}

if($ACTION == 'save'){
	if(!empty($_POST['track'])){
		if(!empty($_POST['add']) && $_POST['add']){
			$track = addTrack($_POST['track']);
		}else{
			$track = saveTrack($_POST['track']);
		}
		$res = array(
			'success' => 1,
			'track' => $track,
			'gid' => $track['track_gid'],
		);
	}
}

if($ACTION == 'delete'){
	if(!empty($_POST['track_gid'])){
		$gid = intval($_POST['track_gid']);
		$success = deleteTrack($gid);
		$res = array(
			'success' => $success,
			'instructions' => 'Successfully deleted the track.',
		);
	}
}

// Fetch Title by GID
if($ACTION == 'track-title-by-gid'){
	if(!empty($_POST['gid'])){
		$tm = new Model('our_tracks');
		$sql = 'SELECT t.track_title, t.artist_id, t.album_id, a.artist_name, al.album_title
						FROM our_tracks t
							LEFT JOIN our_artists a ON t.artist_id = a.artist_id
							LEFT JOIN our_albums al ON t.album_id = al.album_id
						WHERE t.track_gid = ?';
		$track = $tm->db->fetch_row($sql, array(intval($_POST['gid'])));
		$res = array(
			'title' => $track['track_title'],
			'artist_id' => $track['artist_id'],
			'artist_name' => $track['artist_name'],
			'album_id' => $track['album_id'],
			'album_title' => $track['album_title'],
		);
	}
}

// Fetch Title and Artist by GID
if($ACTION == 'track-title-and-artist-by-gid'){
	if(!empty($_POST['gid'])){
		$tm = new Model('our_tracks');
		$sql = 'SELECT t.track_title, a.artist_name 
						FROM our_tracks t 
							INNER JOIN our_artists a ON t.artist_id=a.artist_id 
						WHERE t.track_gid=?';
		
		$track = $tm->db->fetch_row($sql, array(intval($_POST['gid'])));
		$res = array(
			'title' => $track['track_title'],
			'artist' => $track['artist_name'],
		);
	}
}


// ====================================================
// ====================================================
//										QUERY LOGIC
// ====================================================
// ====================================================
function getTracksByAlbum($album_id){
	global $tm;
	$sql = "SELECT t.*, al.album_title, al.album_is_compilation, ar.artist_name 
					FROM our_tracks t 
						INNER JOIN our_albums al ON t.album_id = al.album_id
						INNER JOIN our_artists ar ON t.artist_id = ar.artist_id
					WHERE t.album_id = ?
					ORDER BY t.album_id, t.track_num, t.artist_id, t.track_title";
	$tracks = $tm->db->fetch($sql, array($album_id));
	return $tracks;
}

function getTracksByArtist($artist_id){
	global $tm;
	$sql = "SELECT t.*, al.album_title, al.album_is_compilation, ar.artist_name 
					FROM our_tracks t 
						INNER JOIN our_albums al ON t.album_id = al.album_id
						INNER JOIN our_artists ar ON t.artist_id = ar.artist_id
					WHERE t.artist_id = ?
					ORDER BY t.album_id, t.artist_id, t.track_num, t.track_title";
	$tracks = $tm->db->fetch($sql, array($artist_id));
	return $tracks;
}

function getTracksByLetter($letter){
	global $tm;
	$prep_like = ($letter == '#') ? "REGEXP '^[^A-Za-z]'" : 'LIKE "'.trim($letter).'%"';
	$sql = 'SELECT DISTINCT(t.track_gid), t.track_title, t.artist_id, a.artist_name, al.album_title, al.album_id
					FROM our_tracks t 
						LEFT JOIN our_artists a ON a.artist_id=t.artist_id
						LEFT JOIN our_albums al ON al.album_id=t.album_id
					WHERE t.track_title '.$prep_like.'
					ORDER BY t.track_title ASC';
	$tracks = $tm->db->fetch($sql);
	return $tracks;
	
	// Parameterized was a no-go, since we also need the special chars
	// $prep_like = trim($letter).'%';
	// $tracks = $tm->db->fetch($sql, array( $prep_like ));
}

function getTrack($track_gid){
	global $tm;
	$sql = "SELECT t.*, al.album_title, al.album_is_compilation, ar.artist_name 
					FROM our_tracks t 
						INNER JOIN our_albums al ON t.album_id = al.album_id
						INNER JOIN our_artists ar ON t.artist_id = ar.artist_id
					WHERE t.track_gid = ?";
	$track = $tm->db->fetch_row($sql, array(intval($track_gid)));
	
	// Get alt spellings (indexed for frontend)
	$alt_spellings = $tm->db->fetch("SELECT track_alt_spelling FROM our_tracks__alt_spelling WHERE track_gid=?", array( $track_gid ));
	$track['alt_spellings'] = array();
	foreach($alt_spellings as $i => $alt){
		$track['alt_spellings'][$i] = $alt['track_alt_spelling'];
	}
	
	// Value type conversions
	$track['album_is_compilation'] = boolval($track['album_is_compilation']);
	return $track;
}

function addTrack($track){
	global $tm;
	$track_args = array(
		'track_duration' => $track['track_duration'],
		'track_title' => $track['track_title'],
		'track_isrc' => $track['track_isrc'],
		'track_num' => $track['track_num'],
		'artist_id' => $track['artist_id'],
		'album_id' => $track['album_id'],
	);
	$gid = $tm->insert($track_args);
	$track['track_gid'] = $gid;
	manageAltSpellingsTrack($track);
	return $track;
}

function saveTrack($track){
	global $tm;
	$track_args = array(
		'track_duration' => $track['track_duration'],
		'track_title' => $track['track_title'],
		'track_isrc' => $track['track_isrc'],
		'track_num' => $track['track_num'],
		'artist_id' => $track['artist_id'],
		'album_id' => $track['album_id'],
	);
	$tm->load(intval($track['track_gid']));
	$tm->update($track_args);
	manageAltSpellingsTrack($track);
	return $track;
}

function manageAltSpellingsTrack($args){
	$am = new Model('our_tracks__alt_spelling', 'track_gid');
	$ok = !empty($args['track_gid']);
	$track_gid = intval($args['track_gid']);
	$track_title = $args['track_title'];
	$alt_spellings = !empty($args['alt_spellings']) ? $args['alt_spellings'] : array();
	
	if($ok){	// Insert the new alt spellings. First, delete all associated.
		$am->db->delete("DELETE FROM our_tracks__alt_spelling WHERE track_gid=?", array($track_gid));
		foreach($alt_spellings as $alt){
			if(!empty($alt)){	// Blank string in UI == delete
				$sql = 'INSERT INTO our_tracks__alt_spelling (track_gid, track_title, track_alt_spelling) VALUES (?, ?, ?)';
				$params = array( $track_gid, $track_title, trim($alt) );
				$am->db->insert($sql, $params);
			}
		}
	}else{
		die("Not ok on alt spellings.");
	}
}

function deleteTrack($gid){
	global $tm;
	if(!empty($gid)){
		$tm->load($gid);
		$row_ct = $tm->delete();
		if($ok){
			$row_ct += $tm->db->delete('DELETE FROM our_tracks__alt_spelling WHERE track_gid=?', array($gid));
		}
		return $row_ct;
	}
}
