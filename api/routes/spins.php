<?php /*=============================//

/api/spins/{$ACTION}

=====================================*/
$DEFAULT_PER_PAGE = 50;
$sm = new Model('sxm_perfs');

/* HOW THIS WORKS
	------------------
	Step 1: 
	- Check the post and pick one of three paths.

		-	buildQuery()	    					=>	We have IDs. Join on them
		- buildNoIdQuery()						=>	Owned=1 but we have no IDs. Attempt to join em up
		- buildSimpleQuery()					=>	No owned or IDs. Match on perfs fields only
		- buildEverythingOwnedQuery() =>	We want everything owned that also has filters

	Step 2:
	- Add filters on top of what we're searching. 
		- channel
		- start_date
		- end_date

	Step 3:
	- Run & return.
*/

if($ACTION === 'get-spins'){
	
	//======================
	// PATH 1. WE HAVE IDs.
	//======================
	if( 
		!empty($_POST['artist_id']) or 
		!empty($_POST['album_id']) or 
		!empty($_POST['track_gid'])
	){
		$QUERY = buildQuery($_POST);
	}
	
	//=====================================
	// PATH 2. WE WANT OWNED. SEE LEVEL 2
	//=====================================
	elseif( 
		isset($_POST['owned']) and 
		boolval($_POST['owned']) === true 
	){
		//==========================================================
		// PATH 2, LEVEL 2.
		// WE HAVE OWNED. ATTEMPT TO MATCH, OR JUST GET EVERYTHING?
		//==========================================================
		if( 
			!empty($_POST['artist_name']) or 
			!empty($_POST['album_title']) or 
			!empty($_POST['track_title'])
		){
			$QUERY = buildNoIdQuery($_POST);	// ATTEMPT MATCH.
		}else{
			$QUERY = buildEverythingOwnedQuery($_POST);	// GET EVERYTHING OWNED. CAN STILL HAVE FILTERS, SO... pass the post
		}
	}
	
	//=================================
	// PATH 3. SIMPLE TEXT MATCH.
	// Also used for channel schedules
	//=================================
	elseif( 
		!empty($_POST['artist_name']) or 
		!empty($_POST['track_title']) or
		!empty($_POST['channel']) or
		!empty($_POST['start_date']) or
		!empty($_POST['end_date'])
	){
		$QUERY = buildSimpleQuery($_POST);
	}
	else{
		die( "No acceptable criteria was registered. No spins for you!" );
	}
	
	
	//===============================================
	// 			BEGIN GLOBAL LOGIC
	//===============================================
	
	$model = new Model('sxm_perfs');
	
	$QUERY['sql'] .= ' AND (title, artist) NOT IN (SELECT title, artist FROM sxm_commercials) ';
	
	$spin_sql = $QUERY['sql'] . ' ORDER BY timestamp_utc DESC LIMIT ?, ?';
	if(!$table){
		$table = getTable($_POST);
	}
	$spin_ct_sql = str_replace('SELECT *', 'SELECT COUNT(*)', $QUERY['sql']);
	
	// Pagination logic
	$per_page = !empty($_POST['per_page']) ? intval($_POST['per_page']) : $DEFAULT_PER_PAGE;
	$curr_page = !empty($_POST['page']) && $_POST['page'] != 1 && $_POST['page'] != 0 ? intval($_POST['page']) : 1;
	$offset = $curr_page == 1 ? 0 : ( $curr_page * $per_page ) - $per_page;
	$spin_params = $QUERY['params'];
	$spin_params[] = $offset;
	$spin_params[] = $per_page;
	
	/* 
	dnd(array(
		'limit' => $per_page,
		'offset' => $offset,
	), "Spin Params");
	*/
	
	$ct_params = $QUERY['params'];
	$SPINS = $model->db->fetch($spin_sql, $spin_params);
	$SPIN_CT = intval($model->db->fetch_value($spin_ct_sql, $QUERY['params']));	// Use unmodified params
	$SPINS = refineSpinsForDisplay($SPINS);
	
	
	// ONLY IF WE ARE REQUESTING CSV
	$REQUESTING_CSV = ( !empty($_POST['get_csv']) and intval($_POST['get_csv'] == 1) )  ? true : false;
	if($REQUESTING_CSV){
		$csv_sql = $QUERY['sql'] . ' ORDER BY timestamp_utc DESC';
		// $csv_params = array_splice($QUERY['params'], -2);	// Bump off the limit params
		$csv_params = $QUERY['params'];
		$SPINS_CSV = $model->db->fetch($csv_sql, $csv_params);
		$SPINS_CSV = refineSpinsForDisplay($SPINS_CSV);
	}
	
	$max_pages = 15;	// Temp max limit
	$pages = intval(ceil($SPIN_CT / $per_page));	// How many numbers to round?
	$pages = $pages >= $max_pages ? $max_pages.'+' : $pages;
	
	
	//--------------------------------------------
	// 	FINAL API RESPONSE
	//--------------------------------------------
	
	$res = array(	// Order passed directly to browser!
		
		// Keep for now, until db-manager is stable & reliable.
		'table' => $table,
		
		// Debug exactly what's going into the DB
		// 'spin_sql' => $QUERY['no_sql'] ? array() : $spin_sql,
		// 'spin_params' => $QUERY['no_sql'] ? array() : $spin_params,
		// 'spin_params' => $spin_params,
		// 'params' => $_POST,
		
		// The good stuff
		'spins_in_this_set' => sizeof($SPINS),
		'spin_ct' => $SPIN_CT,
		'spins' => $SPINS,
		'requesting_csv' => $REQUESTING_CSV,
		
		// Pagination
		'per_page' => $per_page,
		'curr_page' => $curr_page,
		// 'pages' => 15,
		
		'pages' => $pages,
		'page' => intval($curr_page),
		'pagination' => range(1, intval($pages)),
	);
	
	if($REQUESTING_CSV){
		// $res['csv_sql'] = $csv_sql;
		// $res['csv_params'] = $csv_params;
		$res['csv'] = csvFromSpins($SPINS_CSV);
	}
}
//===============================================
// 			END GLOBAL LOGIC
//===============================================



//===============================================
// 				BEGIN UNIQUE PATH FUNCTIONS
//===============================================
function refineSpinsForDisplay($spins){
	foreach($spins as &$spin){
		foreach ($spin as $key => $value) {
			if (is_int($key)) {
				unset($spin[$key]);
			}
		}
		$spin['display_channel'] = xref_channel($spin['channel']);
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$spin['display_date'] = $stamp['date'];
		$spin['display_time'] = $stamp['time'];
		
		// Optional...
		$db_stamp = timestampAsIs($spin['timestamp_utc']);
		$spin['db_date'] = $db_stamp['date'];
		$spin['db_time'] = $db_stamp['time'];
	}
	return $spins;
}


function buildQuery($args){
	
	global $sm;
	$wheres = array();	      // _field_ = ?
	$where_params = array();	// $value below
	
	foreach($args as $field => $value){
		
		// OWNED SPINS BY ARTIST
		//============================
		
		if($field === 'artist_id'){
			
			// Get all alt spellings
			$artist_wheres[] = 'artist = ?';
			$artist = $sm->db->fetch_row('SELECT * from our_artists WHERE artist_id=?', array($value));
			$artist_alt_spellings = $sm->db->fetch("SELECT artist_alt_spelling FROM our_artists__alt_spelling WHERE artist_id=?", array($artist['artist_id']));
			$artist_query_names = array(
				$artist['artist_name']	// Starts with the real name, with alts pushed later.
			);
			foreach($artist_alt_spellings as $alt){
				$artist_wheres[] = 'artist = ?';
				$artist_query_names[] = $alt['artist_alt_spelling'];
			}
			
			// Get all tracks by this artist
			$tracks = $sm->db->fetch('SELECT t.*, a.album_title 
				FROM our_tracks t 
					LEFT JOIN our_albums a ON t.album_id=a.album_id 
				WHERE t.artist_id=? 
				ORDER BY t.album_id, t.track_num', array($value));
			$track_wheres = array();
			$track_query_names = array();
			foreach($tracks as &$t){
				$track_wheres[] = 'title=?';
				$track_query_names[] = $t['track_title'];
				$alt_spellings = $sm->db->fetch('SELECT track_alt_spelling FROM our_tracks__alt_spelling WHERE track_gid=?', array($t['track_gid']));
				foreach($alt_spellings as $alt){
					$track_wheres[] = 'title = ?';
					$track_query_names[] = $alt['track_alt_spelling'];
				}
			}
			$where_sql = '('.implode(' OR ', $artist_wheres).') AND ('. implode(' OR ', $track_wheres) .')';
			$where_params = array_merge($artist_query_names, $track_query_names);
			break;
		}
		
		
		// OWNED SPINS BY ALBUM
		//============================
		
		elseif($field === 'album_id'){
			
			// Get all assoc tracks on this album (only way to really make it work)
			$tracks = $sm->db->fetch('SELECT track_title, track_gid, album_id, artist_id FROM our_tracks WHERE album_id=?', array($value));
			
			foreach($tracks as &$track){
				
				$a_wheres = array();
				$t_wheres = array();
				$this_tracks_whereclause = '';
				
				// Get track spellings
				$track_spellings = array($track['track_title']);
				$track_alt_spellings = $sm->db->fetch('SELECT * FROM our_tracks__alt_spelling WHERE track_gid = ?', array($track['track_gid']));
				foreach($track_alt_spellings as $spelling){
					$track_spellings[] = $spelling['track_alt_spelling'];
				}
				
				// Get artist spellings
				$artist_name = $sm->db->fetch_value('SELECT artist_name FROM our_artists WHERE artist_id=?', array($track['artist_id']));
				$artist_spellings = array($artist_name);
				$artist_alt_spellings = $sm->db->fetch('SELECT * FROM our_artists__alt_spelling WHERE artist_id=?', array($track['artist_id']));
				foreach($artist_alt_spellings as $spelling){
					$artist_spellings[] = $spelling['artist_alt_spelling'];
				}
				
				foreach($artist_spellings as $a_spelly){
					$a_wheres[] = 'artist=?';
					$where_params[] = $a_spelly;
				}
				$this_tracks_whereclause .= ' ('. implode($a_wheres, ' OR '). ') ';
				
				foreach($track_spellings as $t_spelly){
					$t_wheres[] = 'title=?';
					$where_params[] = $t_spelly;
				}
				
				// ASSIGN THIS TRACK'S 'WHERE' CLAUSE TO THE GLOBAL ARRAY OF WHERE CLAUSES.
				$this_tracks_whereclause .= ' AND ('. implode($t_wheres, ' OR '). ') ';
				$wheres[] = $this_tracks_whereclause;
				
				// KEEP THIS DEBUG! 
				// This represents ONE track and all of its possible spellings or artist spellings.
				if(0){
					
					echo "This Tracks Where Clause: ";
					echo "";
					var_dump($this_tracks_whereclause);
					echo "Global Wheres: ";
					echo "";
					var_dump($wheres);
					echo "";
					echo "Global where_params:";
					dnd($where_params);
					
					var_dump($track_spellings);
					echo '----------------------------------';
					dnd($artist_spellings);
					// die;
				}
			}
			$where_sql = '( '. implode(') OR ( ', $wheres) . ' )';
			break;
		
			
		// OWNED SPINS BY ARTIST
		//============================
		
		}elseif($field === 'track_gid'){
			
			$wheres[] = 'title = ?';
			$track = $sm->db->fetch_row('SELECT * from our_tracks WHERE track_gid=?', array($value));
			$track_alt_spellings = $sm->db->fetch("SELECT track_alt_spelling FROM our_tracks__alt_spelling WHERE track_gid=?", array($track['track_gid']));
			$track_query_names = array(
				$track['track_title']	// Starts with the real name, with alts pushed later.
			);
			foreach($track_alt_spellings as $alt){
				$wheres[] = 'title = ?';
				$track_query_names[] = $alt['track_alt_spelling'];
			}
			
			$where_params = $track_query_names;
			$where_sql = implode(' OR ', $wheres);
			break;
		}
	}
	
	$tz_offset = 5;	// Hrs desired thing is from EST
	
	if(!empty($args['start_date'])){
		$start_unix_utc = strtotime($args['start_date']);
		$start_unix =  $start_unix_utc + 60 * 60 * $tz_offset;
	}
	if(!empty($args['end_date'])){
		$end_unix_utc = strtotime($args['end_date']);
		$end_unix = $end_unix_utc + 60 * 60 * $tz_offset;
	}
	if(!empty($args['channel'])){
		$where_sql .= ' AND channel=?';
		$where_params[] = intval($args['channel']);
	}
	
	if($start_unix and $end_unix){	// Between
		$where_sql .= ' AND timestamp_utc BETWEEN ? AND ?';
		$where_params[] = $start_unix;
		$where_params[] = $end_unix;
	}elseif($start_unix){	// Since
		$where_sql .= ' AND timestamp_utc >= ?';
		$where_params[] = $start_unix;
	}elseif($end_unix){	// Before
		$where_sql .= ' AND timestamp_utc <= ?';
		$where_params[] = $end_unix;
	}
	
	if(substr($where_sql, 0, 4) === ' AND'){
		$where_sql = substr($where_sql, 4);
	}
	$table = getTable($args);	// $args = $_POST
	if(empty($table)){
		$table = 'sxm_perfs';
	}
	$sql = 'SELECT * FROM '.$table.' WHERE '.$where_sql;
	
	return array(
		'sql' => $sql,
		'params' => $where_params,
	);
}

function buildSimpleQuery($args){
	
	$fields = addFilters($args, 'fields');	// Easier to push onto existing array instead of merging them later.
	$params = addFilters($args, 'params');
	if(!empty($args['artist_name'])){
		$fields[] = 'artist=?';
		$params[] = $args['artist_name'];
	}
	if(!empty($args['track_title'])){
		$fields[] = 'title=?';
		$params[] = $args['track_title'];
	}
	
	$table = getTable($args);

	// Exclude web channels for ALL dynamic queries unless a channel is specifically passed (ex: channel schedule for web channel)
	if(isset($args['channel'])){
		$sql = 'SELECT * FROM '.$table.' perfs WHERE '.implode(' AND ', $fields);
	}else{
		$sql = 'SELECT * FROM '.$table.' perfs WHERE '.implode(' AND ', $fields) . excludeChannelSql();
	}

	$query = array(
		'sql' => $sql,
		'params' => $params,
	);
	return $query;
}

// I don't think this is used.
//=================================
function buildEverythingOwnedQuery($args){
	
	global $sm;
	
	$fields = array();
	$params = array();
	
	$artists = $sm->db->fetch("SELECT * FROM our_artists");
	
	foreach($artists as $a){
		
		// Push all possible spellings for THIS artist onto the array. Redefine it every loop.
		$artist_fields = array(
			'artist = ?'
		);
		$artist = $sm->db->fetch_row('SELECT * from our_artists WHERE artist_id=?', array($a['artist_id']));
		if(!empty($artist)){
			// Get all alt spellings
			$artist_alt_spellings = $sm->db->fetch("SELECT artist_alt_spelling FROM our_artists__alt_spelling WHERE artist_id=?", array($artist['artist_id']));
			$artist_params = array(
				$artist['artist_name']	// Starts with the real name, with alts pushed later.
			);
			if(!empty($artist_alt_spellings)){
				foreach($artist_alt_spellings as $alt){
					$artist_fields[] = 'artist = ?';
					$artist_params[] = $alt['artist_alt_spelling'];
				}
			}
			
			// Get all tracks by this artist
			$track_fields = array();
			$track_params = array();
			$tracks = $sm->db->fetch('SELECT t.*, a.album_title 
				FROM our_tracks t 
					LEFT JOIN our_albums a ON t.album_id=a.album_id 
				WHERE t.artist_id=? 
				ORDER BY t.album_id, t.track_num', array($a['artist_id']));
			
			if(!empty($tracks)){
				foreach($tracks as $t){
					$track_fields[] = 'title = ?';
					$track_params[] = $t['track_title'];
					$alt_spellings = $sm->db->fetch('SELECT track_alt_spelling FROM our_tracks__alt_spelling WHERE track_gid=?', array($t['track_gid']));
					if(!empty($alt_spellings)){
						foreach($alt_spellings as $alt){
							$track_fields[] = 'title = ?';
							$track_params[] = $alt['track_alt_spelling'];
						}
					}
				}	// End tracks per artist loop
			}
			
			// MERGE INTO GLOBAL $FIELDS AND $PARAMS
			if(!empty($artist_fields) && !empty($artist_params) && !empty($track_fields) && !empty($track_params)){
				$fields[] = ' ((' . implode(' OR ', $artist_fields) . ') AND ( '.implode(' OR ', $track_fields).' ))';
				$new_params = array_merge($artist_params, $track_params);
				$params = array_merge($params, $new_params);
			}
				
			if($a['artist_id'] == 4){
					// You can debug stuff here.
			}
		}
	}	// End artist loop
		
	// $where_sql = '('.implode(' OR ', $artist_wheres).') AND ('. implode(' OR ', $track_wheres) .')';
	// $where_params = array_merge($artist_query_names, $track_query_names);
	
	$filters_fields = addFilters($args, 'fields');
	$filters_params = addFilters($args, 'params');
	$params = array_merge($params, $filters_params);
	$table = getTable($args);
	$sql = 'SELECT * FROM '.$table.' perfs WHERE ( '.implode(' OR ', $fields) . ') AND '.implode(' AND ', $filters_fields);
	
	$query = array(
		'sql' => $sql,
		'params' => $params,
		'no_sql' => true,
	);
	return $query;
}

//========================
// HAPPENS TO EVERYTHING!
//========================
function addFilters($args, $mode){	// channel, start_date, end_date, include_web
	
	$filters = array();	// Returns an array no matter what mode.
	
	if(!empty($args['start_date']) and !empty($args['end_date'])){	// This creates a between. Special case.
		if($mode == 'fields'){
			$filters[] = 'perfs.timestamp_utc BETWEEN ? and ?';
		}elseif($mode == 'params'){
			$filters[] = timestampForDatabase($args['start_date']);
			$filters[] = timestampForDatabase($args['end_date']);
		}
	}else{
		if(!empty($args['start_date'])){
			if($mode == 'fields'){
				$filters[] = 'perfs.timestamp_utc >= ?';
			}elseif($mode == 'params'){
				$filters[] = timestampForDatabase($args['start_date']);
			}
		}
		if(!empty($args['end_date'])){
			if($mode == 'fields'){
				$filters[] = 'perfs.timestamp_utc <= ?';
			}elseif($mode == 'params'){
				$filters[] = timestampForDatabase($args['end_date']);
			}
		}
	}	// End start_date/end_date


	// Add channel to args
	if(!empty($args['channel'])){
		if($mode == 'fields'){
			$filters[] = 'perfs.channel=?';
		}elseif($mode == 'params'){
			$filters[] = intval($args['channel']);
		}
	}
	else{	// No channel passed, so we are safe to exclude web.

		if($mode == 'fields'){

			// Exclude web spins unless `include_web=true` passed in args
			if( empty($args['include_web']) || (!empty($args['include_web']) && $args['include_web'] != 'true'))
			{
				// Since this is a subquery, we only need to return filters for 'fields' part of this function.
				$filters[] = 'channel NOT IN (SELECT channel_number FROM sxm_channels WHERE web=1) ';
			}
		}
	}

	return $filters;
}
