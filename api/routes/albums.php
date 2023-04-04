<?php /*=============================//

Routes for /src/pages/albums.js

=====================================*/

// Save query shorthands.
// $std_join = 'our_albums al';

if(isset($ACTION)){	// Global model to prevent re-instantiation
	$model = new Model('our_albums', 'album_id');
}

if($ACTION == 'load'){
	$res = array();
	$label_filter = false;
	
	// GET STUFF by what we pass via $_POST
	if(!empty($_POST['artist_id'])){
		$artist_filter = true;
		$albums = getAlbumsByArtist(intval(trim($_POST['artist_id'])));
		$artist = getArtistInfo(intval(trim($_POST['artist_id'])));
		$res['albums'] = $albums;
	}elseif (!empty($_POST['letter'])){
		$letters = range('a', 'z');
		$letters[] = '#'; // Special Chars!
		$letter = !empty($_POST['letter']) ? trim($_POST['letter']) : 'a';
		$albums = getAlbumsByLetter($letter);
		$res['albums'] = $albums;
	}elseif( isset($_POST['label_id']) ){
		$label_filter = true;
		$label_id = intval($_POST['label_id']);
		$label_filter = true;
		$label_name = getLabelName($label_id);
		$res['label_name'] = $label_name;
		$albums = getAlbumsByLabel($label_id);
		$res['albums'] = $albums;
	}
	
	// Return based on conditions.
	if(isset($artist_filter) && $artist_filter){
		$res['artist'] = !empty($artist) ? $artist : '';
		$res['breadcrumbs_1'] = $albums[0]['artist']['artist_name'];
		$res['breadcrumbs_1_url'] = '/'.$albums[0]['artist']['artist_id'];
		$res['breadcrumbs_2'] = 'All Albums';
	}elseif($label_filter){
		
		$res['label_name'] = $label_name;
		$res['breadcrumbs_1'] = 'By Label';
		$res['breadcrumbs_1_url'] = 'label';
		$res['breadcrumbs_2'] = $label_name;
		// $res['breadcrumbs_2'] = 'All Albums by '.$label_name;
		
	}else{
		$res['artist'] = '';
		$res['breadcrumbs_1'] = 'All Albums (A-Z)';
		if(isset($letter) && $letter){
			$res['breadcrumbs_2'] = $letter;
		}
		if(isset($letters) && $letters){
			$res['letters'] = $letters;
		}
	}
}

if($ACTION == 'albums-by-artist'){
	$artist_id = intval($_POST['artist_id']);
	if(!empty($artist_id)){
		$aba_data = getAlbumsByArtist($artist_id);
		$res = array(
			'albums' => $aba_data['albums'],
			'artists' => $aba_data['artists'],
		);
	}
}

if($ACTION == 'albums-by-letter'){
	$letter = $_POST['letter'];
	if(!empty($letter)){
		$albums = getAlbumsByLetter($letter);
		$res = array(
			'albums' => $albums,
		);
	}
}

if($ACTION == 'albums-by-label'){
	$label_id = $_POST['label_id'];
	if(!empty($label_id)){
		$albums = getAlbumsByLabel($label_id);
		$res = array(
			'albums' => $albums,
		);
	}else{
		die("Provide a label id.");
	}
}

if($ACTION == 'edit-album'){
	if(!empty($_POST['album_id'])){
		$album_id = intval($_POST['album_id']);
		$album = getAlbum($album_id);
		$res = array( 'album' => $album );
	}else{
		die("No album ID supplied to endpoint!");
	}
}

// CAN BE UPDATE * OR * ADD!
if($ACTION == 'update-album'){
	if(empty($_POST['album']['artist_id']) && intval($_POST['album_is_compilation']) !== 1){
		$_POST['album']['artist_id'] = 0;
		$_POST['album']['album_is_compilation'] = 1;
	}
	$add = boolval($_POST['add']);
	$album_id = $add ? createAlbum($_POST['album']) : updateAlbum($_POST['album']);
	$_POST['album']['album_id'] = $album_id;
	
	manageAltReleaseDates($_POST['album']);
	
	$album = getAlbum($album_id);
	$res = array(
		'album' => $album,
		'breadcrumbs_1' => $album['album_title'],
		// 'breadcrumbs_1_url' => '/albums/'
	);
}

if($ACTION == 'view-albums'){
	$artist_model = new Model('our_albums');
	$albums = $artist_model->get_items();
	$res = array(
		'albums' => $albums,
	);
}

if($ACTION == 'album-title-by-id'){
	if(!empty($_POST['id'])){
		$album_id = intval($_POST['id']);
		$am = new Model('our_albums', 'album_id');
		
		$album_sql = "SELECT album_title FROM our_albums WHERE album_id=?";
		$album_title = $am->db->fetch_value($album_sql, array($album_id));
		
		$artist_id = 0;
		$artist_name = "Various Artists";
		
		// Is this a compilation?
		$artist_ct_sql = "SELECT COUNT(artist_id) as ct FROM artist_x_album WHERE album_id=?";
		$artist_ct = $am->db->fetch_value($artist_ct_sql, array($album_id));
		if(intval($artist_ct) == 1){
			$artist_sql = "SELECT a.artist_id, a.artist_name 
											FROM our_artists a 
												LEFT JOIN artist_x_album axa on axa.artist_id=a.artist_id 
											WHERE axa.album_id=?";
			$artist_info = $am->db->fetch_row($artist_sql, array($album_id));
			
			$artist_id = $artist_info['artist_id'];
			$artist_name = $artist_info['artist_name'];
			
			// WE HAVE A NORMAL ALBUM!
			$res = array(
				'id' => $album_id,
				'name' => $album_title,
				'artist_id' => $artist_id, 
				'artist_name' => $artist_name,
			);
				
		}else{
			$res = array(
				'id' => $album_id,
				'name' => $album_title,
				'artist_id' => $artist_id, 
				'artist_name' => $artist_name,
			);
		}
	}
}

if($ACTION == 'load-for-dropdown'){
	$am = new Model('our_albums');
	$dropdown_albums = $am->get_items(array(
		'where' => 'album_title <> "" AND album_title IS NOT NULL',	// Insurance. No idea why those blank albums show up... maybe unsuccessful uploads???
		'order' => 'album_title ASC',
	));
	$res = array(
		'albums' => $dropdown_albums,
	);
}

// NEW! 
// Might want to move if this gets expanded.
// ==========================================

if($ACTION == 'labels-for-dropdown'){
	$lm = new Model('labels');
	$res = array(
		'labels' => $lm->get_items(),
	);
}

if($ACTION == 'label-name-by-id'){
	$l_id = isset($_POST['label_id']) ? intval($_POST['label_id']) : 0;
	$lm = new Model('labels', 'label_id');
	$lm->load($l_id);
	$res = array('label_name' => $lm->data['label_name']);
}


if($ACTION == 'load_homepage'){	// HOMEPAGE RECENT LOADS
	$args = array(	// Top table: now - 3 months
		'where' => 'album_release_date > (DATE_SUB(curdate(), INTERVAL 3 MONTH)) and album_release_date <= curdate()',
		'order' => 'album_release_date desc, album_title asc'
	);
	$args2 = array(	// Middle table: upcoming (anything ahead of today)
		'where' => 'album_release_date > curdate()',
		'order' => 'album_release_date asc, album_title asc'
	);
	$res = array(
		'albums' => getAlbums($args),
		'albums_upcoming' => getAlbums($args2),
		// 'albums_recent' => getAlbums($args3),
	);
}

if($ACTION == 'load_outstanding'){
		$args = array(	// Bottom table: everything recent that ISN'T in the other two tables
		
		// 'Recently uploaded' ... list is TOO BIG to get anybody to do anything with it
		// 'where' => 'album_id NOT IN( SELECT album_id FROM our_albums WHERE album_release_date > (DATE_SUB(curdate(), INTERVAL 6 MONTH))) AND album_id NOT IN( SELECT album_id FROM our_albums WHERE album_release_date > curdate())',
		
		// Something's null or missing
		'where' => 'label_id is null OR label_id=0 OR album_release_date > (DATE_SUB(curdate(), INTERVAL 6 MONTH)) ',
		'order' => 'album_id DESC',
		// 'limit' => 50
	);
	$res = array(
		'albums_recent' => getAlbums($args)
	);
}

if($ACTION == 'delete'){
	if(!empty($_POST['album_id'])){
		$success = deleteAlbum(intval($_POST['album_id']));
		$res = array(
			'success' => $success,
		);
	}
}
