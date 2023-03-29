<?php

if($ACTION == 'get'){
	$tm = new Model('sxm_perfs');
	$sql = "SELECT id as trash_id, title, artist FROM sxm_commercials ORDER BY title";
	$trash = $tm->db->fetch($sql);
	foreach($trash as &$t){
		$args = array($t['title'], $t['artist']);
		$ct = $tm->db->fetch_value("SELECT COUNT(*) as trash_ct FROM sxm_perfs WHERE title=? and artist=?", $args);
		$t['trash_ct'] = $ct;
	}
	$res = array(
		'trash' => $trash,
	);
}

if($ACTION == 'add'){
	$tm = new Model('sxm_commercials');
	if(trim($_POST['title']) && trim($_POST['artist'])){
		
		$params = array($_POST['title'], $_POST['artist']);
		$comm_exists = $tm->db->fetch_value("SELECT COUNT(*) as existing_ct FROM sxm_commercials WHERE title=? and artist=?", $params);
		
		if(intval($comm_exists)){	// There's a record. BAIL.
			$res = array(
				'success' => false,
				'message' => 'record exists',
				'row' => $row,
			);
		}else{
			$insert_data = array(
				'title' => trim($_POST['title']),
				'artist' => trim($_POST['artist']),
			);
			$row = $tm->insert($insert_data);
			$res = array(
				'success' => true,
				'row' => $row,
			);
		}
	}else{
		die("Insufficient data passed.");
	}
}
	
if($ACTION == 'delete'){
	$tm = new Model('sxm_commercials');
	$id = intval($_POST['trash_id']);
	$go = $_POST['qg3'] == 'qg4' ? true : false;	// This is dumb, but it's something
	if($go){
		$sql = "DELETE FROM sxm_commercials WHERE id=$id";
		$affected = $tm->db->delete($sql);
		$success = intval($affected) >= 1 ? true : false;
		$res = array(
			'success' => $success,
			'affected' => $affected,
		);
	}
}