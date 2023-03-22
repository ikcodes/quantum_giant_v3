<?php

$res = array(
	'new_tracks' => array(),
	'tracks_added' => 0,
	'tracks_skipped' => 0,
	'album_created' => false,
	'artist_created' => false,
);

if($ACTION == 'album'){
	if(is_array($_POST['album']) && !empty($_POST['album'])){
		
		$release = !empty($_POST['release_date']) ? $_POST['release_date'] : date('Y-m-d', time());
		$label_id = isset($_POST['label']) ? intval($_POST['label']) : 0;
		
		$album_params = array(	// See parameterizeAlbum
			'album_title' => $_POST['album'][0]['Album'],
			'album_is_compilation' => 0,
			'album_is_single' => count($_POST['album']) > 1 ? 0 : 1,	// More than 1 track? Not a single.
			'album_relese_date' => $release,
			'album_upc' => $_POST['album'][0]['Record Number'],
			'label_id' => $label_id,
		);
		
		// LOOP 1: FIND SHIT OUT
		// =======================
		$compilation = false;	// Set to true for add'l AXA updates
		$first_artist = $_POST['album'][0]['Artist'];
		
		$multi_albums = false;	// Metadata sheet may include multiple albums
		$first_album = $_POST['album'][0]['Album'];
		
		foreach($_POST['album'] as $track){
			if(isset($track['Artist']) and isset($track['Album'])){
				if($compilation === false){
					$compilation = ($track['Artist'] == $first_artist) ? false : true;	// Set to true ONCE, and don't reset it.
				}
				if($multi_albums === false){
					$multi_albums = ($track['Album'] == $first_album) ? false : true;	// Set true ONCE, don't reset.
				}
			}
			if($multi_albums === true){
				break;
			}
		}
		
		// Find artist or create one. (Only for non-comps!)
		$artist_id = 0;
		if($compilation == false){
			$artist_id = findArtistFromMetadata($_POST['album'][0]['Artist']);
			if(intval($artist_id) < 1){
				$artist_id = createArtistFromMetadata($_POST['album'][0]['Artist']);
				$res['artist_created'] = true;
			}
			$album_params['artist_id'] = intval($artist_id);
		}else{	// ADD GLOBAL COMPILATION STATS
			$album_params['album_is_compilation'] = true;
		}
		
		// Find album (or create one!)
		$album_id = 0;
		// If multi albums was set to true, we do this for every track in the loop below.
		if($multi_albums == false){
			$album_id = findAlbumFromMetadata($_POST['album'][0]['Album']);
			
			if(intval($album_id) == 0){
				$album_id = createAlbumFromMetadata($_POST['album'][0]['Album'], $artist_id, $compilation, $track['Record Number'], $release, $label_id);
				$res['album_created'] = true;
				
				if($album_id == 0){
					dnd($album_params, "What the fuck! Here are the params...");
				}
			}
		}
	
		// LOOP 2: DO SHIT WITH IT
		//=========================
		$index = 0;	// Last ditch try
		$tracks_added = 0;
		$tracks_skipped = 0;
			
		$artists_created = 0;
		$albums_created = 0;
		
		foreach($_POST['album'] as $track){
			
			if(empty($track['Title']) or $track['Title'] == 'Title'){	// Skip empty rows! (Present in multi-album sheets)
				continue;
			}
			
			$index++;	// Sets 'track num'
			// Do every time for compilations
			if($compilation == true){
				$artist_id = findArtistFromMetadata($track['Artist']);
				if(intval($artist_id) < 1){
					$artist_id = createArtistFromMetadata($track['Artist']);
					$album_params['artist_created'] = true;
					$artists_created++;
				}
				createBridgeRecordForCompilation($artist_id, $album_id);
			}
			
			if($multi_albums == true){
				$album_id = findAlbumFromMetadata($track['Album']);
				if(intval($album_id < 1)){
					$album_id = createAlbumFromMetadata($track['Album'], $artist_id, $compilation, $track['Record Number'], $release, $label_id);
					$albums_created++;
					$index = 1;
				}
			}
			
			// if($index == 0 && $artist_id && $album_id){
			// 	$mod = new Model('artist_x_album');
			// 	$mod->insert(array(intval($artist_id), intval($album_id)));
			// 	$index++;
			// }
			
			// Create track record
			if($album_id == 0){
				die("This isnt going to work!!!!!!!!!!!!!!");
			}
			
			$track_gid = findTrackFromMetadata($track['Title'], $artist_id, $track['ISRC Code']);
			if(!$track_gid){
				$track_record = array(
					'track_num' => $index,
					'album_id' => $album_id,
					'artist_id' => $artist_id,
					'track_isrc' => strval(trim($track['ISRC Code'])),
					'track_title' => strval(trim($track['Title'])),
					'track_duration' => strval(trim($track['Run Time'])),
				);
				$track_gid = createTrackFromMetadata($track_record);
				if($track_gid){
					$tracks_added++;
					$track_record['track_gid'] = $track_gid;
					array_push($res['new_tracks'], $track_record);
				}else{
					die("Failed creating new tracK!");
				}
			}else{
				error_log('--------> CREATING GID RECORD FOR ' . $track_record['track_title']);
				$tracks_skipped++;
			}
		}
		
		// FINAL RESPONSE
		//================
		$res['artists_created'] = $artists_created;
		$res['albums_created'] = $albums_created;
		$res['tracks_added'] = $tracks_added;
		$res['tracks_skipped'] = $tracks_skipped;
		$res['album_id'] = $album_id;
	}else{
		$res['success']	= false;
	}
}

// CREATE NEW
//============
function createArtistFromMetadata($artist_name){
	$am = new Model('our_artists', 'artist_id');
	$artist_id = $am->insert(array('artist_name' => $artist_name));
	return $artist_id;
}

function createAlbumFromMetadata($album_title, $artist_id, $compilation = 0, $upc = 'NO UPC', $rel_date = '0000-00-00', $label_id = 0){
	$am = new Model('our_albums', 'album_id');
	$album_indata = array(
		'album_title' => $album_title,
		'album_is_single' => 0,
		'album_is_compilation' => $compilation ? 1 : 0,
		'album_upc' => $upc,
		'album_release_date' => $rel_date,
		'label_id' => $label_id,
	);
	$album_id = $am->insert($album_indata);
	if($compilation == 0){
		$am->db->fetch("INSERT INTO artist_x_album(artist_id, album_id) VALUES (?,?)", array($artist_id, $album_id));
	}
	return $album_id;
}

// THIS WAS INSERTING ALBUM IDS OF ZERO into axa
function createBridgeRecordForCompilation($artist_id, $album_id){
	if($artist_id && intval($artist_id) != 0 && $album_id && intval($album_id) != 0){
		$am = new Model('our_albums', 'album_id');
		$bridge_record_exists = $am->db->fetch("SELECT COUNT(*) AS ct FROM artist_x_album WHERE artist_id=? AND album_id=?", array($artist_id, $album_id));
		if(intval($bridge_record_exists[0]['ct']) == 0){	// If the bridge record ain't exist, make a new one.
			$am->db->fetch("INSERT INTO artist_x_album(artist_id, album_id) VALUES (?,?)", array($artist_id, $album_id));
		}
	}
}

function createTrackFromMetadata($track){
	$tm = new Model('our_tracks', 'track_gid');
	$gid = $tm->insert($track);
	if(strlen($track['track_title']) >= 35){	// AUTOMATICALLY create alternate spelling for tracks whose name is long enough to be chopped off by Sirius
		$args = array(
			$gid,
			$track['track_title'],
			substr($track['track_title'], 0, 35)
		);
		$tm->db->insert("INSERT INTO our_tracks__alt_spelling(track_gid, track_title, track_alt_spelling) VALUES(?, ?, ?)", $args);
	}
	return $gid;
}

// FIND EXISTNG
//==============
function findArtistFromMetadata($artist_name){
	$am = new Model('our_artists', 'artist_name');
	$am->load($artist_name);
	if(!empty($am->data) && !empty($am->data['artist_id'])){
		return intval($am->data['artist_id']);
	}
	else // Maybe there's an alt spelling!!!!!!!
	{
		$ama = new Model('our_artists__alt_spelling', 'artist_alt_spelling');
		$ama->load($artist_name);
		if(!empty($ama->data) && !empty($ama->data['artist_id'])){
			return intval($ama->data['artist_id']);
		}else{
			return 0;
		}
	}
}

function findAlbumFromMetadata($album_title){
	$am = new Model('our_albums', 'album_title');
	$am->load($album_title);
	return !empty($am->data) && !empty($am->data['album_id']) ? intval($am->data['album_id']) : 0;
}

function findTrackFromMetadata($track_title, $artist_id, $isrc){	// 04.25.22 Add ISRC to allow duplicate artist/track pairings
	
	$tm = new Model('our_tracks', 'track_title');
	$sql = "SELECT t.track_gid AS gid
					FROM our_tracks t 
						LEFT JOIN our_tracks__alt_spelling alt 
							ON t.track_gid=alt.track_gid
					WHERE (
						t.track_title=? OR alt.track_alt_spelling=?
					)
					AND t.artist_id=?
					AND t.track_isrc=?";
	$res = $tm->db->fetch($sql, array($track_title, $track_title, $artist_id));
	$gid = isset($res[0]['gid']) ? intval($res[0]['gid']) : false;
	return $gid;
}