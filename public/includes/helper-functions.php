<?php

// TIMESTAMP FOR APPLICATION / DATABASE
// ----------------------------------------
// Convert $POST timestamps from EST => UNIX
// Convert MySQL timestamps from UNIX => EST
// 
// https://www.php.net/manual/en/function.date-create.php#76216 for more info

function timestampForDatabase($timestamp){	// RETURNS UNIX INTEGER
	$date = new DateTime($timestamp, new DateTimeZone('America/New_York'));
	$date->setTimezone(new DateTimeZone('UTC'));
	return intval($date->format('U'));
	// dnd($date->format('Y-m-d H:i:s'), 'This is how you debug these. Move it around to test timezones.');
}

function timestampForApplication($timestamp){	// RETURNS array('date', 'time')
	$date = new DateTime("@$timestamp", new DateTimeZone('UTC'));
	$date->setTimezone(new DateTimeZone('America/New_York'));
	$date_verbage = $date->format('F jS, Y');
	
	// If they like "Today..." (worse for exports)
	// $date_compare = new DateTime('now', new DateTimeZone('America/New_York'));
	// $date_verbage = $date->format('F jS, Y') == $date_compare->format('F jS, Y') ? $date->format('F jS, Y').' (Today)' : $date->format('F jS, Y');
	return array(
		'date' => $date_verbage,
		'time' => $date->format('g:i A'),
	);
}

function timestampAsIs($timestamp){	// Same as above, but return database timestamp.
	$date = new DateTime("@$timestamp", new DateTimeZone('UTC'));
	return array(
		'date' => $date->format('m/d/Y'),
		'time' => $date->format('g:i A'),
	);
}

function timestampIntoUTC($timestamp){
	$date = new DateTime("@$timestamp", new DateTimeZone('America/New_York'));
	$date->setTimezone(new DateTimeZone('UTC'));
	return intval($date->format('U'));
}

function getTable($post){
	$table = 'sxm_perfs';
	$stamps = array('start_date' => null, 'end_date' => null);
	if(isset($post['start_date'])){
		$stamps['start_date'] = makeTimestamp($post['start_date']);
	}
	if(isset($post['end_date'])){
		$stamps['end_date'] = makeTimestamp($post['end_date']);
	}
	if(($stamps['start_date']) && ($stamps['end_date'])){
		$table = ( oldTimestamp($stamps['start_date']) || oldTimestamp($stamps['end_date']) ) ? 'sxm_perfs_master' : $table;
	}elseif(($stamps['start_date'])){
		$table = oldTimestamp($stamps['start_date']) ? 'sxm_perfs_master' : $table;
	}elseif(($stamps['end_date'])){	// Should this just be... perfsm? Regardless? 'All the spins up to...'? inb4 someone complains about this line 05.10.21
		$table = oldTimestamp($stamps['end_date']) ? 'sxm_perfs_master' : $table;
	}
	return $table;
}

function getTableFromBetweenParams($params){	// start unix ts and end unix ts
	$table = 'sxm_perfs';
	if(isset($params[0]) && isset($params[1])){
		$table = ( oldTimestamp($params[0]) || oldTimestamp($params[1]) ) ? 'sxm_perfs_master' : $table;
	}elseif(isset($params[0])){
		$table = oldTimestamp($params[0]) ? 'sxm_perfs_master' : $table;
	}elseif(isset($params[1])){
		$table = oldTimestamp($params[1]) ? 'sxm_perfs_master' : $table;
	}
	return $table;
}

function excludeChannelSql(){
	$cm = new Model('sxm_channels');
	$chans = $cm->get_items(array(
		'select' => 'channel_number',
		'where' => 'web=1',
	));
	if(empty($chans)){
		return " AND channel IS NOT NULL ";
	}
	foreach($chans as $chan){
		$disregard_chans[] = $chan['channel_number'];
	}
	$sql = "AND channel <> " . implode($disregard_chans, " AND channel <> ") . " AND channel IS NOT NULL";
	return $sql;
}

function oldTimestamp($ts){
	$old = false;
	// if(!isValidTimeStamp($start_ts)){	// Keep this for now, you might need it later BUT.... it's useless and broke the API endpoint
	// 	$ts = strtotime($ts);
	// }else{
	// 	die("Valid TS!");
	// }
	if($ts < strtotime('-6 months')) {
		$old = true;
	}
	return $old;
}

function makeTimestamp($ts){	// If this isn't already a timestamp... make it one!
	return is_numeric($ts) ? $ts : strtotime($ts);
}

function isValidTimeStamp($timestamp){
	return ((string) (int) $timestamp === $timestamp) 
			&& ($timestamp <= PHP_INT_MAX)
			&& ($timestamp >= ~PHP_INT_MAX);
}


// QUERY HELPERS FOR /summary routes
//-----------------------------------

function getBetweenClause($weeks_shown, $just_text = 0){	// Pass a 1 to get "timestamp_utc BETWEEN 123456 AND 345678" as plaintext. Default is bound params.
	
	// Query in UTC!
	$pd_int = intval($weeks_shown);
	$monday_in_utc = strtotime('Monday this week');
	$monday_this_week = $monday_in_utc;
	
	if($pd_int === 0){	// Incomplete week (this week)
		$pd_start = $monday_this_week;
		$pd_calc = strtotime("+7 day", $monday_this_week);
		$pd_end = strtotime("-1 minute", $pd_calc);
	}
	elseif($pd_int >= 1){
		$start_num = $pd_int * 7;
		$start_str = "-$start_num day";
		$pd_start = strtotime($start_str, $monday_this_week);
		$pd_calc = strtotime("+7 day", $pd_start);
		$pd_end = strtotime("-1 minute", $pd_calc);
	}else{
		die("Invalid period.");
	}
	
	// EXPERIMENTAL! Seems to work for now...
	//======================
	// if(1){
		$start_fixed = timestampIntoUTC($pd_start);
		$end_fixed = timestampIntoUTC($pd_end);
		// die("past here");
		if($just_text){
			return "(timestamp_utc BETWEEN $start_fixed AND $end_fixed )";
		}else{
			$clause = "( timestamp_utc BETWEEN ? AND ? )";
			return array(
				'clause' => $clause,
				'params' => array($start_fixed, $end_fixed),
			);
		}
	// }else{
		
	// 	// END EXPERIMENTAL
	// 	//===============================
	// 	if($just_text){
	// 		return "(timestamp_utc BETWEEN $pd_start AND $pd_end )";
	// 	}else{
	// 		$clause = "( timestamp_utc BETWEEN ? AND ? )";
	// 		return array(
	// 			'clause' => $clause,
	// 			'params' => array($pd_start, $pd_end),
	// 		);
	// 	}
	// }
}

function whereClauseForTrack($gid){
	$model = new Model('our_artists');
	$track_sql = "SELECT t.track_gid, t.artist_id, t.track_title, alt.track_alt_spelling 
								FROM our_tracks t 
									LEFT JOIN our_tracks__alt_spelling alt ON t.track_gid=alt.track_gid 
								WHERE t.track_gid=?";
	$track_stuff = $model->db->fetch($track_sql, array($gid));
	$artist_id = $track_stuff[0]['artist_id'];
	$artist_sql = "SELECT a.artist_name, a.artist_id, alt.artist_alt_spelling 
									FROM our_artists a 
										LEFT JOIN our_artists__alt_spelling alt ON a.artist_id=alt.artist_id 
									WHERE a.artist_id=?";
	$artist_stuff = $model->db->fetch($artist_sql, array($artist_id));
	
	$query_params = array();
	$track_wheres = array();
	$artist_wheres = array();
	foreach($artist_stuff as $a){
		if(!empty($a['artist_name']) && !in_array($a['artist_name'], $query_params)){
			$query_params[] = $a['artist_name'];
			$artist_wheres[] = 'artist=?';
		}
		if(!empty($a['artist_alt_spelling']) && !in_array($a['artist_alt_spelling'], $query_params)){
			$query_params[] = $a['artist_alt_spelling'];
			$artist_wheres[] = 'artist=?';
		}
	}
	
	foreach($track_stuff as $t){
		if(!empty($t['track_title']) && !in_array($t['track_title'], $query_params)){
			$track_wheres[] = 'title=?';
			$query_params[] = $t['track_title'];
		}
		if(!empty($t['track_alt_spelling']) && !in_array($t['track_alt_spelling'], $query_params)){
			$track_wheres[] = 'title=?';
			$query_params[] = $t['track_alt_spelling'];
		}
		// $i++;	/// ... why was this ever here?
	}
	
	$where_clause = '('.implode(' OR ', $artist_wheres).') AND ('.implode(' OR ', $track_wheres) . ')';
	
	return array(
		'clause' => $where_clause,
		'params' => $query_params,
	);
	// DEBUG:
	// return array(
	// 	'WHERE CLAUSE === ' => $where_clause,
	// 	'QUERY PARAMS' => $query_params,
	// 	'artist stuff' => $artist_stuff,
	// 	'track stuff' => $track_stuff,
	// );
}


function whereClauseForAlbum($album_id){
	$model = new Model('sxm_perfs');
	$t_sql = "SELECT t.track_gid, t.track_title, alt.track_alt_spelling, a.album_title
						FROM our_tracks t 
							LEFT JOIN our_albums a ON t.album_id=a.album_id
							LEFT JOIN our_tracks__alt_spelling alt ON t.track_gid=alt.track_gid 
						WHERE t.album_id=?";
	$a_sql = "SELECT a.artist_name, a.artist_id, alt.artist_alt_spelling 
						FROM our_artists a 
							LEFT JOIN our_artists__alt_spelling alt ON a.artist_id=alt.artist_id 
							LEFT JOIN artist_x_album axa ON axa.artist_id=a.artist_id
						WHERE axa.album_id=?";
	
	$track_stuff = $model->db->fetch($t_sql, array($album_id));
	$artist_stuff = $model->db->fetch($a_sql, array($album_id));
	
	// Get query results into arrays to query perfs for all possible spellings.
	$query_params = array();
	$track_wheres = array();
	$artist_wheres = array();
	
	foreach($artist_stuff as $a){
		if(!empty($a['artist_name']) && !in_array($a['artist_name'], $query_params)){
			$query_params[] = $a['artist_name'];
			$artist_wheres[] = 'artist=?';
		}
		if(!empty($a['artist_alt_spelling']) && !in_array($a['artist_alt_spelling'], $query_params)){
			$query_params[] = $a['artist_alt_spelling'];
			$artist_wheres[] = 'artist=?';
		}
	}
	
	foreach($track_stuff as $t){
		if(!empty($t['track_title']) && !in_array($t['track_title'], $query_params)){
			$track_wheres[] = 'title=?';
			$query_params[] = $t['track_title'];
		}
		if(!empty($t['track_alt_spelling']) && !in_array($t['track_alt_spelling'], $query_params)){
			$track_wheres[] = 'title=?';
			$query_params[] = $t['track_alt_spelling'];
		}
	}
	
	$where_clause = '( '.implode(' OR ', $artist_wheres).' ) AND ( '.implode(' OR ', $track_wheres) . ' )';
	
	return array(
		'clause' => $where_clause,
		'params' => $query_params,
	);
}	// End ALBUM CLAUSE


function whereClauseForArtist($artist_id){
	$model = new Model('sxm_perfs');
	$t_sql = "SELECT t.track_gid, t.track_title, alt.track_alt_spelling, a.album_title
						FROM our_tracks t 
							LEFT JOIN our_albums a ON t.album_id=a.album_id
							LEFT JOIN our_tracks__alt_spelling alt ON t.track_gid=alt.track_gid 
						WHERE t.artist_id=?";
	
	$a_sql = "SELECT a.artist_name, a.artist_id, alt.artist_alt_spelling 
						FROM our_artists a 
							LEFT JOIN our_artists__alt_spelling alt ON a.artist_id=alt.artist_id 
						WHERE a.artist_id=?";
	
	$track_stuff = $model->db->fetch($t_sql, array($artist_id));
	$artist_stuff = $model->db->fetch($a_sql, array($artist_id));
	
	// Get query results into arrays to query perfs for all possible spellings.
	$query_params = array();
	$track_wheres = array();
	$artist_wheres = array();
	
	foreach($artist_stuff as $a){
		if(!empty($a['artist_name']) && !in_array($a['artist_name'], $query_params)){
			$query_params[] = $a['artist_name'];
			$artist_wheres[] = 'artist=?';
		}
		if(!empty($a['artist_alt_spelling']) && !in_array($a['artist_alt_spelling'], $query_params)){
			$query_params[] = $a['artist_alt_spelling'];
			$artist_wheres[] = 'artist=?';
		}
	}
	
	foreach($track_stuff as $t){
		if(!empty($t['track_title']) && !in_array($t['track_title'], $query_params)){
			$track_wheres[] = 'title=?';
			$query_params[] = $t['track_title'];
		}
		if(!empty($t['track_alt_spelling']) && !in_array($t['track_alt_spelling'], $query_params)){
			$track_wheres[] = 'title=?';
			$query_params[] = $t['track_alt_spelling'];
		}
	}
	
	$where_clause = '( '.implode(' OR ', $artist_wheres).' ) AND ( '.implode(' OR ', $track_wheres) . ' )';
	
	return array(
		'clause' => $where_clause,
		'params' => $query_params,
	);
}	// END CLAUSE 4 ARTIST

function whereClauseForLabel($label_id){
	
	$label_params = array();
	$label_clauses = array();
	$model = new Model('our_albums');
	
	$label_gids = $model->db->fetch("SELECT track_gid FROM our_tracks WHERE album_id IN(SELECT album_id FROM our_albums WHERE label_id=?)", array($label_id));
	foreach($label_gids as $gid_res){
		$gid = intval($gid_res[0]);
		$stuff = whereClauseForTrack($gid);
		array_push($label_clauses, $stuff['clause']);
		foreach($stuff['params'] as $param){
			array_push($label_params, $param);
		}
	}
	
	$where_clause = '( '.implode(') OR (', $label_clauses).' )';
	return array(
		'clause' => $where_clause,
		'params' => $label_params,
	);
	
}	// End LABEL CLAUSE

function getBetweenCustom($start_date, $end_date = null, $just_text = 0){
	
	// Complex default
	$start_date = timestampForDatabase($start_date);
	$end_date = $end_date === null ? timestampForDatabase('11:59PM tonight') : timestampForDatabase($end_date);
	if($just_text){
		return "(timestamp_utc BETWEEN $start_date AND $end_date )";
	}else{
		$clause = "( timestamp_utc BETWEEN ? AND ? )";
		return array(
			'clause' => $clause,
			'params' => array($start_date, $end_date),
		);
	}
}


// FRONTEND READABILITY FUNCTIONS
function xref_channel($channel_id = 0){
	
	if($channel_id && intval($channel_id)){
		$cm = new Model('sxm_channels');
		$c = $cm->db->fetch_value("SELECT channel_name FROM sxm_channels WHERE channel_number=?", array($channel_id));
		/*
		switch(intval($channel_id)):
			case 77:  $c = "Kidz Bop"; break;
			case 78:  $c = "Kids Place Live"; break;
			case 93:  $c = "Netflix Is A Joke"; break;
			case 94:  $c = "Comedy Greats"; break;
			case 95:  $c = "Comedy Central Radio"; break;
			case 96:  $c = "Kevin Hart's Laugh Out Loud"; break;
			case 97:  $c = "Jeff and Larry"; break;
			case 98:  $c = "Laugh USA"; break;
			case 99:  $c = "Raw Dog Comedy"; break;
			case 104:  $c = "Comedy Classics"; break;
			case 105:  $c = "She's So Funny"; break;
			case 106:  $c = "She's So Funny - Web Channel"; break;
			case 168: $c = "Canada Laughs"; break;
			
			case 16:  $c = "The Blend"; break;
			case 741:  $c = "The Village"; break;
			case 782:  $c = "Christmas Spirit"; break;
			
			default:  $c = 'No Channel'; break;
		endswitch;
		*/
	}else{
		$c = 'No Channel';
	}
	return $c ? $c : 'No Channel';
}

function getWeektext($week_int){
	if( intval($week_int) >= 0 ){
		switch(intval($week_int)){
			
			case 0:
				$timestamp = 'Monday this week';
				$date = new DateTime($timestamp, new DateTimeZone('America/New_York'));
				// $c = $date->format('m/d') . 'This Week';
				$c = 'This Week        ';
			break;
			
			case 1:
				$start_date = new DateTime('Monday last week', new DateTimeZone('America/New_York'));
				$start_str = $start_date->format('m/d');
				$end_date = $start_date->modify('+6 day');
				$end_str = $end_date->format('m/d');
				$c = $start_str .' - '.$end_str;
			break;
			
			default:
				$start_date = new DateTime('Monday '.($week_int-1).' weeks ago', new DateTimeZone('America/New_York'));
				$start_str = $start_date->format('m/d');
				$end_date = $start_date->modify('+6 day');
				$end_str = $end_date->format('m/d');
				$c = $start_str .' - '.$end_str;
			break;
		}
	}else{
		$c = 'Undefined!';
	}
	return $c;
}


// CSV SHIT
function csvFromSpins($spins){
	$csv = array(
		array('Title', 'Artist', 'Channel', 'Date', 'Time'),	// $arr[0] is headers
	);
	foreach($spins as $spin){
		$this_spin = array(
			$spin['title'], $spin['artist'], $spin['display_channel'], $spin['display_date'], $spin['display_time']
			// 'Title' => $spin['title'],
			// 'Artist' => $spin['artist'],
			// 'Channel' => $spin['display_channel'],
			// 'Date' => $spin['display_date'],
			// 'Time' => $spin['display_time'],
		);
		$csv[] = $this_spin;
	}
	return $csv;
}

function csvForSummary($spins){
	$csv = array(
		array(	// Double nest - these are all arrays.
			'Artist', 'Spins'
		)
	);
	foreach($spins as $spin_ct){
		$row = array(
			$spin_ct['artist_name'],
			$spin_ct['spin_ct'],
		);
		$csv[] = $row;
	}
	return $csv;
}

function csvForDan($spins){
	// $categories = array(
		// 0 => 'TOTAL', 
		// 99 => 'Raw Dog', 
		// 98 => 'Laugh USA',
		// 96 => 'LOL', 
		// 97 => 'J&L', 
		// 168 => 'JFL'
	// );
	// $headers = array();
	// foreach($categories as $cat){
		// $headers[] = getHeadersForCategory($cat);
	// }
	// $csv = array_merge($headers);
	
	// Headers are alllllready in there
	foreach($spins as $row){
		$csv[] = $row;
	}
	return $csv;
}

function csvForTopAlbums($spins){
	$csv = array(
		array(	// Double nest - these are all arrays.
			'Album', 'Spins'
		)
	);
	foreach($spins as $spin_ct){
		$row = array(
			$spin_ct['album_title'],
			$spin_ct['spin_ct'],
		);
		$csv[] = $row;
	}
	return $csv;
}


function flatten($in_arr){
	$objTmp = (object) array('aFlat' => array());
	array_walk_recursive($in_arr, create_function('&$v, $k, &$t', '$t->aFlat[] = $v;'), $objTmp);
	$out_arr = $objTmp->aFlat;
	return $out_arr;
}


/*
94: "Comedy Greats",
			95: "Comedy Central Radio",
			96: "Kevin Hart's Laugh Out Loud",
			97: "Blue Collar Comedy",
			98: "Laugh USA",
			99: "Raw Dog",
			168: "Canadian Comedy Jukebox",
			77: "Kids Place Live",
			78: "Kidz Bop",
			93: "Netflix Is A Joke Radio",
			*/