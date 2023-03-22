<?php

/* DAN SUMMARY
========================

MAIN SUMMARY: 
- Catalog fields: 
	- Album, Artist, Release Date, CAT Num
- Data fields:
	- Inception | Weekly Avg | TW vs. LW | TW | TW vs. Weekly Avg | TM Spins | Monthly Avg | TM vs. Monthly Avg
- Channels (each have Data Fields)
	- All | Raw Dog | Laugh USA | LOL | J&L | JFL (Canada?)

ETC NOTES:
- EVERY ALBUM
- Make check boxes for channels and USE NUMBERS.
*/

//=====================================================================
// Options make this request incredibly slow.
// BUT, in prod, there's no CORS so there are no OPTIONS requests :D
$EMERGENCY_LIMIT = 1000;
//=====================================================================

$sm = new Model('sxm_perfs');

if($ACTION == 'export'){
	if(isset($_POST['start_date'])){
		$post_ts = strtotime($_POST['start_date']);
		$spins = getSummary($post_ts);
	}else{
		die("No DATE!");
	}
	$res['summary'] = $spins;
	$res['csv_filename'] = '800PGR_FILEMAKER_EXPORT_'.$_POST['start_date'].'.csv';
	// dnd($res);
}


function getSummary($ts){
	global $EMERGENCY_LIMIT;
	global $categories;
	$am = new Model('our_albums');
	
	$params = array(
		'order' => 'album_title ASC',
	);
	if($EMERGENCY_LIMIT){
		$params['limit'] = $EMERGENCY_LIMIT;
	}
	$albums = getAlbums($params);
	$channels = $am->db->fetch('SELECT * FROM sxm_channels ORDER BY channel_id WHERE web=0');
	
	// START CSV ROWS w/ header
	$headers = array(
		array(
			'Album', 'Artist', 'Release Date', 'CAT Num',
		)
	);
	
	$categories = array(
		0 => 'TOTAL', 
		99 => 'Raw Dog', 
		98 => 'Laugh USA',
		96 => 'LOL', 
		97 => 'J&L', 
		168 => 'JFL'
	);
	foreach($categories as $cat){
		$headers[] = getHeadersForCategory($cat);
	}
	
	$row_headers = array();
	foreach($headers as $head){
		foreach($head as $h){
			$row_headers[] = $h;
		}
	}
	
	// They should be arrays, js converts them
	// $header_str = '';
	// foreach($headers as $h){
		// if(substr(h, -2) !== ', '){
			// $h = $h . ', ';
		// }
		// $header_str .= $h;
	// }
	
	// OVERALL ROW
	$rows = array();
	
	foreach($albums as $album){
		$row = createSummaryRow($album, $ts);
		$rows[] = $row;
	}
	array_unshift($rows, $row_headers);
	return $rows;
}

// VALUES for ONE ROW
function createSummaryRow($album, $ts){
	
	global $categories;
	$wc = getWhereClause($album);
	
	// VALUES to RETURN:
	//------------------
	// Inception,
	// Weekly Avg,
	// TW vs. LW,
	// TW,
	// TW vs. Weekly Avg,
	// TM Spins,
	// Monthly Avg,
	// TM vs. LM
	// TM vs. Monthly Avg,
	
	// Start off with album info
	$greater_row = array(
		array(
			$album['album_title'], 
			$album['artist_name'], 
			$album['album_release_date'], 
			$album['album_cat_num'], 
		)
	);
	
	foreach($categories as $cat_int => $cat){
		
		// GET THE NECESSARY DATA
		$inception_ct = intval(getInceptionCt($wc));
		$weekly_avg = intval(getWeeklyAverage($wc, $ts, 12));	// Let's do 12 weeks
		$spins_monthly = intval(getMonthlyAverage($wc, $ts, 3));	// Let's do 3 months
		$spins_tw = intval(getSpinsTw($wc, $ts));
		$spins_lw = intval(getSpinsLw($wc, $ts));
		$spins_tm = intval(getSpinsTm($wc, $ts));
		$spins_lm = intval(getSpinsLm($wc, $ts));
		
		// DATA PER CATEGORY PER ROW
		//==========================
		$row_arr = array(
			// DECODED, BITCH
			// ==============
			
			
			// Inception
			$inception_ct,
			
			// Weekly Avg
			$weekly_avg,
			
			// TW vs. LW
			getPctChange($spins_lw, $spins_tw),
			
			// TW
			$spins_tw,
			
			// TW vs. Weekly Avg
			getPctChange($weekly_avg, $spins_tw),
			
			// TM Spins
			$spins_tm,
			
			// Monthly Avg
			$spins_monthly,
			
			// TM vs. LM
			getPctChange($spins_lm, $spins_tm),
			
			// TM vs. Monthly
			getPctChange($spins_monthly, $spins_tm),
		);
		array_push($greater_row, array_values($row_arr));
	}
	
	$csv_row = flatten($greater_row);
	return $csv_row;
}


// BASE 'vs.' FORMULA: ( this / that )* 100
// EX: 30(this) / 10(avg) = 300% over average
// OR: 3 (this) / 10(avg) = 30% of average

function getPctChange($a, $b){
	
	if($a == 0 && $b == 0){
		return '0';
	}
	elseif($a == 0){
		return '0';
	}elseif($b == 0){
		return '1000';
	}
	
	$pct_chg = (1 - $a / $b) * 100;
	$rounded_pct = round(floatval($pct_chg), 2);
	return $rounded_pct;
}

function getWhereClause($album){
	return whereClauseForAlbum($album['album_id']);
}

function getHeadersForCategory($header_subcat){
	return array(
		$header_subcat.' Inception',
		$header_subcat.' Weekly Avg',
		$header_subcat.' TW vs. LW',
		$header_subcat.' TW',
		$header_subcat.' TW vs. Weekly Avg',
		$header_subcat.' TM Spins',
		$header_subcat.' Monthly Avg',
		$header_subcat.' TM vs. LM',
		$header_subcat.' TM vs. Monthly',
	);
}

// =====================================
// =============> QUERIES <=============
// =====================================

function getInceptionCt($wc){
	global $sm;
	$ct = intval($sm->db->fetch_value("SELECT COUNT(*) FROM sxm_perfs_master WHERE ". $wc['clause'], $wc['params']));
	return $ct;
}

function getSpinsTw($wc, $ts = 0){
	$start_ts = $ts;
	$end_ts = strtotime("+7 day", $ts);
	$query_prep = getBetweenWithUnix($start_ts, $end_ts);
	return iWantSomeSpins($wc, $query_prep);
}

function getSpinsLw($wc, $ts = 0){
	$start_ts = strtotime("-7 day", $ts);
	$end_ts = $ts;
	$query_prep = getBetweenWithUnix($start_ts, $end_ts);
	return iWantSomeSpins($wc, $query_prep);
}

function getSpinsTm($wc, $ts = 0){
	$start_ts = strtotime("-21 day", $ts);
	$end_ts = strtotime("+7 day", $ts);
	$query_prep = getBetweenWithUnix($start_ts, $end_ts);
	return iWantSomeSpins($wc, $query_prep);
}

function getSpinsLm($wc, $ts = 0){
	$start_ts = strtotime("-49 day", $ts);
	$end_ts = strtotime("-21 day", $ts);
	$query_prep = getBetweenWithUnix($start_ts, $end_ts);
	return iWantSomeSpins($wc, $query_prep);
}

function getWeeklyAverage($wc, $ts = 0, $weeks = 12){
	global $sm;
	$spins = array(); // fill with data to average
	$start_ts = $ts;
	$end_ts = strtotime("+7 day", $ts);
	for($i = 0; $i <= $weeks; $i++){
		$query_prep = getBetweenWithUnix($start_ts, $end_ts);
		$spins[] = iWantSomeSpins($wc, $query_prep);
		$start_ts = strtotime("-7 day", $start_ts);
		$end_ts = strtotime("-7 day", $end_ts);
	}
	$a = array_filter($spins);	// watch out for zeroes
	$average = round(array_sum($a)/count($a), 2);
	return $average;
}

function getMonthlyAverage($wc, $ts = 0, $months = 3){
	global $sm;
	$spins = array(); // fill with data to average
	$start_ts = strtotime("-23 day", $ts);
	$end_ts = strtotime("+7 day", $ts);
	for($i = 0; $i <= $months; $i++){
		$query_prep = getBetweenWithUnix($start_ts, $end_ts);
		$spins[] = iWantSomeSpins($wc, $query_prep);
		$start_ts = strtotime("-1 month", $start_ts);
		$end_ts = strtotime("-1 month", $end_ts);
	}
	$a = array_filter($spins);	// watch out for zeroes
	$average = round(array_sum($a)/count($a), 2);
	return $average;
}


// HELPERS
// ---------------------
function iWantSomeSpins($wc, $query_prep){	// QUERY_PREP: 
	global $sm;
	$sql = "SELECT COUNT(*) FROM sxm_perfs WHERE ".$wc['clause']. $query_prep['clause'];
	$params = array_merge($wc['params'], $query_prep['params']);
	$spinct = $sm->db->fetch_value($sql, $params);
	return intval($spinct);
}


function getBetweenWithUnix($ts1, $ts2, $just_text = false){
	if($just_text){
		return " AND ( timestamp_utc BETWEEN ".$ts1. " AND ".$ts2." )";
	}else{
		return array(
			'clause' => " AND ( timestamp_utc BETWEEN ? AND ? )",
			'params' => array($ts1, $ts2),
		);
	}
}


/* ALBUM RECORD: 

album_id, 
album_title, 
album_is_single, 
album_is_compilation, 
album_release_date, 
album_upc, 
artist_name, 
album_cat_num, 
label_id, 
artist => array( artist_name, artist_id )
label_name, 
*/

/*

TIMESTAMP LOGIC: 
=================

GET ONE TIMESTAMP: 

Say, Sunday Jan 2

THIS WEEK: 			TS => TS + 1wk
LAST WEEK: 			TS - 1wk => TS
THIS MONTH: 		TS - 3 wk => TS + 1wk 
WEEKLY AVG: 		TS - (n-1)wk => TS + 1 wk => 
MONTHLY AVG: 		MULTIPLY WEEKLY AVG. BY 4


*/
