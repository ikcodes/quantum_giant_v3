<?php /*=============================//

/api/spin-summary/{$ACTION}

=====================================*/

if($ACTION == 'get-top-spinners'){
	
	// Post decode
	$start_date = isset($_POST['start_date']) ? date('Y-m-d H:i:s', strtotime($_POST['start_date'])) : date('Y-m-d H:i:s', time());
	$end_date = isset($_POST['end_date']) ? date('Y-m-d H:i:s', strtotime($_POST['end_date'] . ' +23 hours 59 minutes 59 seconds')) : date('Y-m-d H:i:s', strtotime(time() . + '23 hours 59 minutes 59 seconds'));
	$channel = !empty($_POST['channel']) ? intval($_POST['channel']) : 0;
	
	// Helpers
	$clause = getBetweenCustom($start_date, $end_date);
	$summary = getTopSpinners($clause, $channel);
	
	// Create response
	$res['csv_filename'] = createFilenameCustom($start_date, $end_date);
	$res['spins'] = $summary['spins'];
	$res['summary'] = $summary;
	$res['csv'] = csvForSummary($summary['spins']);
}


if($ACTION == 'get-top-albums'){
	
	// Post decode
	$start_date = isset($_POST['start_date']) ? date('Y-m-d H:i:s', strtotime($_POST['start_date'])) : date('Y-m-d H:i:s', time());
	$end_date = isset($_POST['end_date']) ? date('Y-m-d H:i:s', strtotime($_POST['end_date'] . ' +23 hours 59 minutes 59 seconds')) : date('Y-m-d H:i:s', strtotime(time() . + '23 hours 59 minutes 59 seconds'));
	$channel = !empty($_POST['channel']) ? intval($_POST['channel']) : 0;
	
	// Helpers
	$clause = getBetweenCustom($start_date, $end_date);
	$summary = getTopAlbums($clause, $channel);
	
	// Create response
	$res['csv_filename'] = createFilenameCustom($start_date, $end_date);
	$res['spins'] = $summary['spins'];
	$res['summary'] = $summary;
	$res['csv'] = csvForTopAlbums($summary['spins']);
}


function getTopSpinners($between, $channel = 0){
	$spins = array();
	$where = $between['clause'];
	$params = $between['params'];
	// $table = getTableFromBetweenParams($params);	// Huh?
	$table = 'sxm_perfs';
	if(!empty($channel)){
		$where .= " AND channel=?";
		array_push($params, $channel);
	}
	$where .= " AND (title, artist) NOT IN (SELECT title, artist FROM sxm_commercials)";
	$sql = "SELECT DISTINCT(artist) as artist_name, COUNT(artist) as spin_ct FROM $table WHERE $where GROUP BY artist ORDER BY spin_ct DESC limit 500";
	$model = new Model($table);
	$spins = $model->db->fetch($sql, $params);
	return array(
		'params' => $params,
		'sql' => $sql,
		'table' => $table,
		'spins' => $spins,
	);
}


function getTopAlbums($between, $channel = 0){
	
	$spins = array();
	$where = $between['clause'];
	$params = $between['params'];	// THIS GETS ADDED TO!
	// $table = getTableFromBetweenParams($params);	// Huh?
	$table = 'sxm_perfs';
	if(!empty($channel)){
		$where .= " AND channel=?";
		array_push($params, $channel);
	}
	$where .= " AND (title, artist) NOT IN(SELECT title, artist FROM sxm_commercials)";
	
	$spins = array();
	$am = new Model('our_albums');
	$albums = $am->get_items();
	
	foreach($albums as $album){
		$wc = whereClauseForAlbum($album['album_id']);
		$album_sql = "SELECT COUNT(*) FROM $table WHERE ".$wc['clause']." AND ".$where;
		$album_params = array_merge($wc['params'], $params);
		$album_spinct = intval($am->db->fetch_value($album_sql, $album_params));
		// $spins[$album['album_title']] = $album_spinct;
		$spins[] = array(
			'album_title' => $album['album_title'],
			'album_id' => $album['album_id'],
			'spin_ct' => $album_spinct,
		);
	}
	usort($spins, function($a, $b) {	https://stackoverflow.com/questions/2699086/how-to-sort-a-multi-dimensional-array-by-value
    return $b['spin_ct'] <=> $a['spin_ct'];
	});
	
	return array(
		'params' => $params,
		'sql' => $sql,
		'table' => $table,
		'spins' => $spins,
	);
}

function createFilenameCustom($start_date, $end_date, $channel = 0){
	// $channel_str = !empty($channel) ? "_CHANNEL-$channel" : '_ALL-CHANNELS';
	$channel_str = '';
	return 'SiriusXM_Top_Spinners__'. date('Y-m-d', strtotime($start_date)) .'_to_'. date('Y-m-d', strtotime($end_date)).$channel_str.'.csv';
}