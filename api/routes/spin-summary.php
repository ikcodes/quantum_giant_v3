<?php /*=============================//

/api/spin-summary/{$ACTION}

=====================================*/

if($ACTION == 'summary'){
	$week = intval($_POST['weeks_back']);
	$clause = getBetweenClause($week);
	$channel = !empty($_POST['channel']) ? intval($_POST['channel']) : 0;
	
	// $start_time = time();
	$summary = getSpinSummary($clause, $channel);
	// $end_time = time();
	
	// $res['ss_runtime'] = $end_time - $start_time;
	$res['summary'] = $summary;
	
	// Stuff for ReactCSV https://www.npmjs.com/package/react-csv
	$res['csv'] = csvForSummary($summary['spins']);
	$res['csv_filename'] = createFilename($week);
}

if($ACTION == 'summary-custom'){

	// Post decode
	$start_date = date('Y-m-d H:i:s', strtotime($_POST['start_date']));
	$end_date = date('Y-m-d H:i:s', strtotime($_POST['end_date'] . ' +23 hours 59 minutes 59 seconds'));
	$channel = !empty($_POST['channel']) ? intval($_POST['channel']) : 0;
	
	// Helpers
	$clause = getBetweenCustom($start_date, $end_date);
	$summary = getSpinSummary($clause, $channel);
	
	// Create response
	$res['csv_filename'] = createFilenameCustom($start_date, $end_date);
	$res['spins'] = $summary['spins'];
	$res['summary'] = $summary;
	$res['csv'] = csvForSummary($summary['spins']);
}


function getSpinSummary($between, $channel = 0){	// $time = array( 'clause', 'params' ), $channel = int
	
	$s_time = time();
	
	$master_ct = 0;
	$spins = array();
	$top_artist = '';
	$top_spin_ct = 0;
	
	$model = new Model('our_artists');
	$table = getTableFromBetweenParams($between['params']);
	
	$sql = 'SELECT * FROM '.$table.' WHERE ';
	$artists = $model->get_items(array('order' => 'artist_name'));
	
	foreach($artists as $artist){
		$artist_stuff = whereClauseForArtist($artist['artist_id']);
		if(sizeof($artist_stuff['params']) >= 1){	 // Avoid errant artists w/ no tracks
			
			$artist_sql = $sql . $artist_stuff['clause'] .' AND '. $between['clause'];
			$artist_params = array_merge($artist_stuff['params'], $between['params']);
			
			if(!empty($channel)){	// Add channel if passed
				$artist_sql .= " AND channel = ?";
				array_push($artist_params, $channel);
			}

			$artist_sql .= excludeChannelSql(); // Includes space before next 'AND'
			
			// Get 
			if(!empty($artist_params) && (strpos($artist_sql, '( AND )') == false)){
				$artist_spins = $model->db->fetch($artist_sql, $artist_params);
				if(!empty($artist_spins) && sizeof($artist_spins)){
					foreach($artist_spins as &$spin){
						$spin['display_channel'] = xref_channel($spin['channel']);
						$format = timestampForApplication(intval($spin['timestamp_utc']));
						$spin['display_date'] = $format['date'];
						$spin['display_time'] = $format['time'];
					}
					
					// This is NOT the response, but the inner array
					$spins[$artist['artist_name']] = array(
						'artist_id' => intval($artist['artist_id']),
						'artist_name' => $artist['artist_name'],
						'spin_ct' => sizeof($artist_spins),
						
						// Debuggery

						// 'sql' => $artist_sql,
						// 'params' => $artist_params,
						// 'spins' => $artist_spins,
					);
					$master_ct += sizeof($artist_spins);
				}
			}
		}
	}
	
	// Sort by top spinner
	usort($spins, function($a, $b) {
		return $b['spin_ct'] <=> $a['spin_ct'];
	});
	
	$runtime = time() - $s_time;
	return array(
		'spin_ct' => $master_ct,
		'top_artist' => $spins[0]['artist_name'],
		'top_artist_spins' => $spins[0]['spin_ct'],
		'spins' => $spins,
		'table' => $table,
		'run_time' => $runtime,
	);
}

function createFilename($week){
	$filename = 'SiriusXM_Spin_Summary__';
	
	// $date1 = $week == 0 ? 'Monday next week' : 'Monday '.$week.' weeks ago';
	if($week == 0){
		$date1 = 'Monday this week';
		$date2 = 'Monday next week';
	}elseif($week == 1){
		$date1 = 'Monday last week';
		$date2 = 'Monday this week';
	}elseif($week == 2){
		$date1 = 'Monday 2 weeks ago';
		$date2 = 'Monday last week';
	}else{
		$date1 = 'Monday '. (intval($week))   .' weeks ago';
		$date2 = 'Monday '. (intval($week)-1) .' weeks ago';
	}
	$date1_str = date('Y-m-d', strtotime($date1));
	$date2_str = date('Y-m-d', strtotime($date2));
	
	$filename .= $date1_str .'_to_'.$date2_str.'.csv';
	return $filename;
}

function createFilenameCustom($start_date, $end_date){
	return 'SiriusXM_Spin_Summary__'. date('Y-m-d', strtotime($start_date)) .'_to_'. date('Y-m-d', strtotime($end_date)).'.csv';
}