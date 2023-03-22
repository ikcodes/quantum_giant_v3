<?php

if($ACTION == 'list'){
	$sm = new Model('labels');
	$labels = $sm->get_items(array('where' => 'label_id <> 0'));
	$res = array(
		'labels' => $labels,
	);
}

if($ACTION == 'label-name-by-id'){
	$l_id = isset($_POST['label_id']) ? intval($_POST['label_id']) : 0;
	$res = array('label_name' => getLabelByID($l_id));
}

if($ACTION == 'edit-label'){
	$sm = new Model('labels');
	$label = $sm->db->fetch_row('SELECT * FROM labels WHERE label_id=?', array($_POST['label_id']));
	$res = array(
		'label' => $label,
	);
}

if($ACTION == 'update-label'){
	
	$lm =  new Model('labels', 'label_id');
	if(!isset($_POST['label_name'])){ die("Please provide a label name to... wait for it... SAVE a label name."); }
	$vals = array(
		'label_name' => $_POST['label_name']
	);
	if($_POST['add']){
		$id = $lm->insert($vals);
		$res = array(
			'new_id' => $id,
			'vals' => $vals,
		);
	}else{
		$lm->load($_POST['label_id']);
		$q_res = $lm->update($vals);
		$res = array(
			'success' => $q_res,
			'data' => $lm->data,
		);
	}
}

if($ACTION == 'delete'){
	if(!empty($_POST['label_id'])){
		$label_id = intval($_POST['label_id']);
		$lm = new Model('labels', 'label_id');
		$lm->load($label_id);
		$row_ct = $lm->delete();
		
		// UPDATE ALBUMS TABLE TO DIS-USE THIS LABEL ID
		$lm->db->update("UPDATE our_albums SET label_id=0 WHERE label_id=?", array($label_id));
		
		$res = array(
			'success' => $row_ct >= 1 ? true : false,
			'instructions' => 'Delete operation concluded. Success Count: '.$row_ct,
		);
	}
}


if($ACTION == 'summary'){
	$res = getLabelSummary($_POST, false);
}

if($ACTION == 'summary-csv'){
	$res = getLabelSummary($_POST, true);
}

function getLabelByID($l_id){
	$lm = new Model('labels', 'label_id');
	$lm->load($l_id);
	return $lm->data['label_name'];
}


function getLabelSummary($post, $csv = false){
	
	// DECODE POST
	$DOING_CUSTOM = false;
	$res = array();
	$label_id = intval($post['label_id']);
	$label_name = getLabelName($label_id);
	$channel = !empty($post['channel']) ? intval($post['channel']) : 0;	// This CAN'T come in as zero!
	$label_id = ( isset($post['label_id']) || $post['label_id'] == 0 ) ? intval($post['label_id']) : null;	// This CAN come in zero!
	
	if($post['custom']){	// Pass TIME!!! To avoid false cutoff. Also account for timezones.
		
		$DOING_CUSTOM = true;
		$start_ts = !empty($post['start_date']) ? timestampForDatabase($post['start_date']. ' 00:00:00') : timestampForDatabase('2000-01-01 00:00:00');
		$end_ts = (!empty($post['end_date'])) ? timestampForDatabase($post['end_date']. ' 23:59:59') : timestampForDatabase('2050-01-01 23:59:59');	// TRY ADDING FUCKING TIME ? TO BOTH?
	}else{
		$weeks_shown = !empty($post['weeks']) ? intval($post['weeks']) : 4;
	}
	
	// Pagination, baby.
	$slice_len = 100;
	$slice_start = isset($post['slice_start']) ? intval($post['slice_start']) : 0;
	$slice_end = $slice_start + $slice_len;
	
	// INIT VARS FOR LOOP
	$upper_bound = 0;
	$spins = array();
	$results = array();
	$chartData = array();
	$weeks = range(0, $weeks_shown);
	
	// GO!
	$table = getTable($post);
	$sm = new Model($table);
	$sql = 'SELECT * FROM ' . $table;
	
	$artist_spellings = getArtistsByLabel($label_id);
	$track_spellings = getTracksByLabel($label_id);
	
	if($DOING_CUSTOM){
		
		$channel_sql = (!empty($channel) ? ' AND channel=? ' : '') . excludeChannelSql();
		$between_sql = "( timestamp_utc BETWEEN ? AND ? )";
		$custom_sql = "SELECT * FROM $table WHERE artist IN ( ".str_repeat('?, ', intval(sizeof($artist_spellings) -1 ))."? )  AND title IN ( ".str_repeat('?, ', intval(sizeof($track_spellings) -1 ))."? ) AND ".$between_sql . $channel_sql . " ORDER BY timestamp_utc desc";
		$custom_params = array_merge($artist_spellings, $track_spellings, array($start_ts, $end_ts));
		$res['SQL'] = $custom_sql;
		$res['Params'] = $custom_params;
		if(!empty($channel) && $channel != 0){
			$custom_params[] = $channel;
		}
		$spins = $sm->db->fetch($custom_sql, $custom_params);
		$spin_ct = sizeof($spins);
		
	}else{
		foreach($weeks as $week){	// Weekly queries so we can create the graph
			/* ORDER OF PARAMS: 
					- artists
					- titles
					- timestamps
					- channels ( optional )
			*/
			$between_stuff = getBetweenClause($week, 0, 1);
			$channel_sql = ( !empty($channel) ? ' AND channel=? ' : '' ) . excludeChannelSql();
			$tw_sql = "SELECT * FROM $table WHERE artist IN ( ".str_repeat('?, ', intval(sizeof($artist_spellings) -1 ))."? )  AND title IN ( ".str_repeat('?, ', intval(sizeof($track_spellings) -1 ))."? ) AND ".$between_stuff['clause'] . $channel_sql . " ORDER BY timestamp_utc desc";
			$tw_params = array_merge($artist_spellings, $track_spellings, $between_stuff['params']);
			if(!empty($channel)){ $tw_params[] = $channel; }
			$tw_spins = $sm->db->fetch($tw_sql, $tw_params);
			$upper_bound = (sizeof($tw_spins) <=> $upper_bound ) === 1 ? sizeof($tw_spins) : $upper_bound;
			$weektext = getWeektext($week);	// Returns a string for the graph
			$tw_chartdata = array(
				'Week' => $weektext,
				'Spins' => sizeof($tw_spins) > 0 ? sizeof($tw_spins) : 0,
			);
			
			// GET THEM TO THE CHOPPAH
			$results[$week] = sizeof($tw_spins);	// For calculating average
			array_push($chartData, $tw_chartdata);
			$spins = array_merge($spins, $tw_spins);
		}
	}
	
	if($weeks_shown > 0){
		$results_for_avg = $results;
		array_shift($results_for_avg);
		$avg = round(array_sum($results_for_avg) / count($results_for_avg));
	}else{
		$avg = round(array_sum($results));
	}
	$spin_ct = sizeof($spins);
	
	//===========================================================
	// IF NOT CSV, SPINS TRUNCATED HERE FOR BROWSER SPEED!!!!!!
	//===========================================================
	
	if(!$csv){	// Slice it if not csv, before running it thru the gauntlet
		$spins = array_slice($spins, $slice_start, $slice_end);
		$csv_from_spins = array();
	}
	
	foreach($spins as &$spin){
		$spin['display_channel'] = xref_channel($spin['channel']);
		// Want EST? Use timestampForApplication()
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$spin['display_date'] = $stamp['date'];
		$spin['display_time'] = $stamp['time'];
	}
	
	if($csv){	// This function needs the reformatted stuff above
		$csv_from_spins = csvFromSpins($spins);
	}
	
	if($csv){
		// $res = array(
			// 'csv' => $csv_from_spins,
			// 'filename' => str_replace(' ', '-', getLabelByID($label_id)) . '-LABEL-SUMMARY.csv',
		// );
		$res['csv'] = $csv_from_spins;
		$res['filename'] = str_replace(' ', '-', getLabelByID($label_id)) . '-LABEL-SUMMARY.csv';
	}else{
		// $res = array(
			// For header info:
			// 'upper_bound' => $upper_bound,
			// 'spin_ct' => $spin_ct,
			// 'average' => $avg,
			// 'csv' => $csv_from_spins,
			// 'chartData' => array_reverse($chartData),	// Chart goes Old -> New
			// 'spins' => $spins,	// Detail table
			// );
			$res['upper_bound'] = $upper_bound;
			$res['spin_ct'] = $spin_ct;
			$res['average'] = $avg;
			$res['csv'] = $csv_from_spins;
			$res['chartData'] = array_reverse($chartData);	// Chart goes Old -> New
			$res['spins'] = $spins;	// Detail table
	}
	return $res;
}

function getArtistsByLabel($label_id){
	$artist_sql1 = "SELECT DISTINCT ar.artist_name
									FROM our_tracks t 
									LEFT JOIN our_albums al 
										ON t.album_id=al.album_id 
									LEFT JOIN our_artists ar 
										ON t.artist_id=ar.artist_id
									WHERE al.label_id=? AND ar.artist_name IS NOT NULL AND ar.artist_name <> ''";
	
	$artist_sql2 = "SELECT DISTINCT ar.artist_alt_spelling
									FROM our_tracks t 
									LEFT JOIN our_albums al 
										ON t.album_id=al.album_id 
									LEFT JOIN our_artists__alt_spelling ar 
										ON t.artist_id=ar.artist_id
									WHERE al.label_id=? AND ar.artist_alt_spelling IS NOT NULL AND ar.artist_alt_spelling <> ''";
	
	$ret_spellings = array();
	$m = new Model('our_artists');
	$artist_res_1 = $m->db->fetch($artist_sql1, array($label_id));
	$artist_res_2 = $m->db->fetch($artist_sql2, array($label_id));
	$artist_spellings = array_merge($artist_res_1, $artist_res_2);
	foreach($artist_spellings as $spelling){
		$field = isset($spelling['artist_alt_spelling']) ? 'artist_alt_spelling' : 'artist_name';
		$ret_spellings[] = $spelling[$field];
	}
	// dnd($artist_res_2);
	return $ret_spellings;
}

function getTracksByLabel($label_id){
	$artist_sql1 = "SELECT DISTINCT t.track_title
									FROM our_tracks t 
									LEFT JOIN our_albums al 
										ON t.album_id=al.album_id 
									WHERE al.label_id=? AND t.track_title IS NOT NULL AND t.track_title <> ''";
	
	$artist_sql2 = "SELECT DISTINCT t_alt.track_alt_spelling AS track_title
									FROM our_tracks__alt_spelling t_alt
									LEFT JOIN our_tracks t 
										ON t_alt.track_gid=t.track_gid
									LEFT JOIN our_albums al 
										ON t.album_id=al.album_id
									WHERE al.label_id=? 
										AND t_alt.track_alt_spelling IS NOT NULL 
										AND t_alt.track_alt_spelling <> ''";
	
	$ret_spellings = array();
	$m = new Model('our_tracks');
	$track_res_1 = $m->db->fetch($artist_sql1, array($label_id));
	$track_res_2 = $m->db->fetch($artist_sql2, array($label_id));
	$track_spellings = array_merge($track_res_1, $track_res_2);
	foreach($track_spellings as $spelling){
		$ret_spellings[] = $spelling['track_title'];
	}
	return $ret_spellings;
}

