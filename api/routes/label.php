<?php /*=============================//

/api/label/{$ACTION}

=====================================*/

if($ACTION == 'list'){
	$sm = new Model('labels');
	$labels = $sm->get_items(array('where' => 'label_id <> 0', 'order' => 'label_name ASC'));
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

	$res = array();

	// DECODE POST
	//====================
	$DOING_CUSTOM = false;
	$channel = !empty($post['channel']) ? intval($post['channel']) : 0;	// This CAN'T come in as zero!
	$label_id = isset($post['label_id']) ? intval($post['label_id']) : 0; // This CAN come in zero!
	$label_name = getLabelName($label_id);
	if($post['custom']){	// Pass TIME!!! To avoid false cutoff. Also account for timezones.
		$DOING_CUSTOM = true;
		$start_ts = !empty($post['start_date']) ? timestampForDatabase($post['start_date']. ' 00:00:00') : timestampForDatabase('2000-01-01 00:00:00');
		$end_ts = (!empty($post['end_date'])) ? timestampForDatabase($post['end_date']. ' 23:59:59') : timestampForDatabase('2050-01-01 23:59:59');
	}else{
		$weeks_shown = !empty($post['weeks']) ? intval($post['weeks']) : 4;
	}

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
	
	//----------------------------------------------------------------
	// BUILD QUERY |  new format as of 04.2023
	// Prevent duplicates by segragating queries by particular album.
	//----------------------------------------------------------------
	$label_album_ids = getAlbumIdsByLabel($label_id);
	$master_clause = array();
	$master_params = array();
	foreach($label_album_ids as $id){
		$this_wc = whereClauseForAlbum($id);
		$master_clause[] = $this_wc['clause'];
		$master_params[] = $this_wc['params'];
	}

	// Ex:  [ artist_1, title_1, title_2, artist_3, title_4, title_5 ]
	$all_album_params = flatten($master_params);
	// Ex:  ( (artist=?) AND (title=? OR title=?)) OR ( (artist=?) AND (title=? OR title=?) )
	$all_album_clause = "(( " . implode(" )  OR  ( " , flatten($master_clause))." ))";	// Need TWO sets of parenthesis.

	// OR  ( (  ) AND (  ) )
	$all_album_clause = str_replace('OR  ( (  ) AND (  ) )', '', $all_album_clause);	// This bullshit sneaks in here. Get rid of it.

	// Keep this to debug SQL.
	// $master_sql_statement = vsprintf(str_replace("?", "`%s`", $all_album_clause), $all_album_params);
	// die($master_sql_statement);

	if($DOING_CUSTOM){
		
		// SQL pieces
		$between_sql = '( timestamp_utc BETWEEN ? AND ? )';
		$channel_sql = (!empty($channel) ? ' AND channel=? ' : '');
		$custom_sql =  "SELECT * 
										FROM $table 
										WHERE $all_album_clause
										AND ". $between_sql . $channel_sql ."
										AND channel NOT IN (SELECT channel_number FROM sxm_channels WHERE web=1)
										ORDER BY timestamp_utc DESC";
		
		// Assemble matching params
		$custom_params = array_merge($all_album_params, array($start_ts, $end_ts));
		if(!empty($channel) && $channel != 0){
			$custom_params[] = $channel;
		}
		$spins = $sm->db->fetch($custom_sql, $custom_params);
		$spin_ct = sizeof($spins);
		
	}else{
		foreach($weeks as $week){	// Weekly queries so we can create the graph

			$between_stuff = getBetweenClause($week, 0, 1);
			$channel_sql = ( !empty($channel) ? ' AND channel=? ' : '' );
			
			$tw_sql =  "SELECT * 
									FROM $table 
									WHERE $all_album_clause
										AND ".$between_stuff['clause'] . $channel_sql ." 
										AND channel NOT IN (SELECT channel_number FROM sxm_channels WHERE web=1)
										ORDER BY timestamp_utc desc";

			// FIRE THIS WEEK'S QUERY
			$tw_params = array_merge($all_album_params, $between_stuff['params']);
			if(!empty($channel)){
				$tw_params[] = $channel;
			}

			// debugSqlAndParams($tw_sql, $tw_params);

			$tw_spins = $sm->db->fetch($tw_sql, $tw_params);

			// GRAPH STUFF
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

	//==========================================================================
	// END DISTINCT LOGIC FOR WEEKLY / CUSTOM-DATE SUMMARIES	
	//==========================================================================
	
	if($weeks_shown > 0){
		$results_for_avg = $results;
		array_shift($results_for_avg);
		$avg = round(array_sum($results_for_avg) / count($results_for_avg));
	}else{
		$avg = round(array_sum($results));
	}
	$spin_ct = sizeof($spins);
	
	// SET PAGINATION
	//===================
	$MAX_PAGES = 15;
	$SPINS_PER_PAGE = 200;
	$slice_start = isset($post['page']) ? (intval($post['page']) * $SPINS_PER_PAGE) - $SPINS_PER_PAGE: 0;

	if(!$csv){	// Slice it if not csv, before running it thru the gauntlet
		$spins = array_slice($spins, $slice_start, $SPINS_PER_PAGE);
		$csv_from_spins = array();
	}
	
	foreach($spins as &$spin){
		$spin['display_album'] = xref_album_name($spin['title'], $spin['artist']);
		$spin['display_channel'] = xref_channel($spin['channel']);
		// Want EST? Use timestampForApplication()
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$stamp = timestampForApplication($spin['timestamp_utc']);
		$spin['display_date'] = $stamp['date'];
		$spin['display_time'] = $stamp['time'];
	}
	
	if($csv){
		$csv_from_spins = csvFromSpinsAlbum($spins);
	}
	
	if($csv){
		$res['csv'] = $csv_from_spins;
		$res['filename'] = str_replace(' ', '-', getLabelByID($label_id)) . '-LABEL-SUMMARY.csv';
	}else{
			$res['upper_bound'] = $upper_bound;
			$res['spin_ct'] = $spin_ct;
			$res['average'] = $avg;
			$res['csv'] = $csv_from_spins;
			if(count($spins)){
				$res['chartData'] = array_reverse($chartData);	// Chart goes Old -> New
			}else{
				$res['chartData'] = array();
			}
			$res['spins'] = $spins;	// Detail table
		
			// pagination stuff
			$last_page = ceil(intval($spin_ct) / intval($SPINS_PER_PAGE));
			$last_page_to_display = $last_page >= $MAX_PAGES ? $MAX_PAGES : $last_page;	// Only display the max, they can use the export if they like instead
			$res['pagination'] = ($last_page > 1) ? range(1, ($last_page_to_display)) : array();
			$res['pages'] = $last_page;
	}
	return $res;
}

function getAlbumIdsByLabel($label_id){
	$m = new Model('our_albums');
	$album_ids = $m->db->fetch_value("SELECT GROUP_CONCAT(album_id) FROM our_albums WHERE label_id=?", array($label_id));
	return explode(",", $album_ids);
}
