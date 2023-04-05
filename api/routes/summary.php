<?php

// CUSTOM DATE RANGE QUERY
//============================
if($ACTION == 'track-custom' || $ACTION == 'artist-custom' || $ACTION == 'album-custom'){
	
	$table = getTable($_POST);
	
	// Global post decodes => UID pulled out below 
	$start_date = date('Y-m-d H:i:s', strtotime($_POST['start_date']));
	$end_date = date('Y-m-d H:i:s', strtotime($_POST['end_date'] . ' +23 hours 59 minutes 59 seconds'));
	$channel = !empty($_POST['channel']) ? intval($_POST['channel']) : 0;
	
	if(!$start_date){ die("Endpoint needs start AND end dates!"); }
	
	// All possible spellings for artist and all possible tracks
	$sm = new Model($table);
	$sql = "SELECT * FROM ".$table." WHERE ";
	
	if($ACTION == 'track-custom' && !empty($_POST['track_gid'])){
		$uid = intval($_POST['track_gid']);
		$query_prep = whereClauseForTrack($uid);
	}elseif($ACTION == 'album-custom' && !empty($_POST['album_id'])){
		$uid = intval($_POST['album_id']);
		$query_prep = whereClauseForAlbum($uid);
	}elseif($ACTION == 'artist-custom' && !empty($_POST['artist_id'])){
		$uid = intval($_POST['artist_id']);
		$query_prep = whereClauseForArtist($uid);
	}else{
		die("Did not match an action, or need more from the post.");
	}
	
	// Separate results set by weeks back. Capture highest qty. of spins per week 
	$upper_bound = 0;
	$spins = array();
	$results = array();
	$weeks = range(0, $weeks_shown);
	$chartData = array();
	
	// Build query
	$between_stuff = getBetweenCustom($start_date, $end_date);
	$channel_sql = !empty($channel) ? 'AND channel=?' : '';

	// Build SQL statment - exclude web spins
	$custom_sql = $sql . $query_prep['clause'] . ' AND ' . $between_stuff['clause'] .' '.$channel_sql. excludeChannelSql() . ' ORDER BY timestamp_utc DESC';

	$params = array_merge($query_prep['params'], $between_stuff['params']);
	if(!empty($channel)){	// Only query for channel if passed.
		array_push($params, $channel);
	}
	
	$spins = $sm->db->fetch($custom_sql, $params);
	
	foreach($spins as &$spin){
		$spin['display_channel'] = xref_channel($spin['channel']);
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$spin['display_date'] = $stamp['date'];
		$spin['display_time'] = $stamp['time'];
		
		// Optional...
		$db_stamp = timestampAsIs($spin['timestamp_utc']);
		$spin['db_date'] = $db_stamp['date'];
		$spin['db_time'] = $db_stamp['time'];
	}
	
	// Much simpler response!
	$res = array(
		
		// Need a debug?
		// 'params' => array(
		// 	'computed_start' => $start_date, 
		// 	'computed_end' => $end_date,
		// 	'raw_start' => strtotime($_POST['start_date']),
		// 	'raw_end' => strtotime($_POST['end_date']),
		// ),
		
		// For header info:
		'spin_ct' => sizeof($spins),
		
		// CSV
		'csv' => csvFromSpins($spins),
		
		// For table:
		'spins' => $spins,
	);
}



//	STANDARD QUERY (WEEK-BY-WEEK)
//==================================

if($ACTION == 'artist' || $ACTION == 'album' || $ACTION == 'track'){
	
	$table = getTable($_POST);
	
	// Global post decodes => UID pulled out below 
	$weeks_shown = intval($_POST['weeks_shown']);
	$channel = !empty($_POST['channel']) ? intval($_POST['channel']) : 0;
	
	if($weeks_shown < 0 ){ die("Endpoint needs a positive wks shown"); }
	
	// All possible spellings for artist and all possible tracks
	$sm = new Model($table);
	$sql = "SELECT * FROM ".$table." WHERE ";
	
	if($ACTION == 'track' && !empty($_POST['track_gid'])){
		$uid = intval($_POST['track_gid']);
		$query_prep = whereClauseForTrack($uid);
	}elseif($ACTION == 'album' && !empty($_POST['album_id'])){	// FIX HERE IN CASE OF COMPILATIONS!!!! WHERE CLAUSE IS COMING OUT BLANK CAUSE IMPROPER PROPS PASSED TO FUNCTION
		$uid = intval($_POST['album_id']);
		$query_prep = whereClauseForAlbum($uid);
	}elseif($ACTION == 'artist' && !empty($_POST['artist_id'])){
		$uid = intval($_POST['artist_id']);
		$query_prep = whereClauseForArtist($uid);
	}else{
		die("Did not match an action, or need more from the post.");
	}
	
	// Separate results set by weeks back. Capture highest qty. of spins per week 
	$upper_bound = 0;
	$spins = array();
	$results = array();
	$weeks = range(0, $weeks_shown);
	$chartData = array();
	
	// Find timestamp & query for this week.
	foreach($weeks as $week){
		$between_stuff = getBetweenClause($week);
		$channel_sql = !empty($channel) ? 'AND channel=?' : '';
		
		// Omit she's so funny web channel AND Netflix is a Joke
		$this_weeks_sql = $sql . $query_prep['clause'] . ' AND ' . $between_stuff['clause'] .' '.$channel_sql.' '. excludeChannelSql() .' ORDER BY timestamp_utc DESC';
		
		$this_weeks_params = array_merge($query_prep['params'], $between_stuff['params']);
		if(!empty($channel)){	// Only query for channel if passed.
			array_push($this_weeks_params, $channel);
		}
		$this_weeks_spins = $sm->db->fetch($this_weeks_sql, $this_weeks_params);
		
		$weektext = getWeektext($week);	// Returns a string for the graph
		$this_weeks_chartdata = array(
			'Week' => $weektext,
			'Spins' => sizeof($this_weeks_spins) > 0 ? sizeof($this_weeks_spins) : 0,
		);
		$results[$week] = sizeof($this_weeks_spins);	// For calculating average
		array_push($chartData, $this_weeks_chartdata);
		$spins = array_merge($spins, $this_weeks_spins);
		$upper_bound = (sizeof($this_weeks_spins) <=> $upper_bound ) === 1 ? sizeof($this_weeks_spins) : $upper_bound;
	}
	
	foreach($spins as &$spin){
		$spin['display_channel'] = xref_channel($spin['channel']);
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$spin['display_date'] = $stamp['date'];
		$spin['display_time'] = $stamp['time'];
		
		// Optional...
		$db_stamp = timestampAsIs($spin['timestamp_utc']);
		$spin['db_date'] = $db_stamp['date'];
		$spin['db_time'] = $db_stamp['time'];
	}
	
	if($weeks_shown > 0){
		$results_for_avg = $results;
		array_shift($results_for_avg);
		$avg = round(array_sum($results_for_avg) / count($results_for_avg));
	}else{
		$avg = round(array_sum($results));
	}
	
	$res = array(
		// For header info:
		'upper_bound' => $upper_bound,
		'spin_ct' => sizeof($spins),
		'average' => $avg,
		
		// CSV
		'csv' => csvFromSpins($spins),
		
		// For chart:
		// 'chartData' => $chartData,							// Chart goes New -> Old
		'chartData' => array_reverse($chartData),	// Chart goes Old -> New
		
		// For table:
		'spins' => $spins,
	);
}