<?php /*=============================//

/api/artists/{action}

=====================================*/

if($ACTION == 'load'){	// GET req
	$cm = new Model('sxm_channels');
	$channels = $cm->get_items(array('order' => 'channel_number'));
	$res = array(
		'channels' => $channels,
	);
}

if($ACTION == 'load-for-dropdown'){
	$cm = new Model('sxm_channels');
	$channels = $cm->get_items(array('order' => 'channel_number'));
	$ret_chans = array();
	$ret_chans[] = array(
		'key' => 0,
		'value' => 0,
		'label' => 'All Channels'
	);
	foreach($channels as $chan){
		$ret_chans[] = array(
			'key' 	=> intval($chan['channel_number']),
			'value' => intval($chan['channel_number']),
			'label' => $chan['channel_name'],
		);
	}
	$res = array(
		'channels' => $ret_chans,
	);
}

if($ACTION == 'edit-channel'){
	$channel_number = $_POST['channel_number'];
	$am = new Model('sxm_channels');
	$sql = "SELECT  channel_number, 
									channel_name, 
									channel_key, 
									web 
									FROM sxm_channels 
									WHERE channel_number=?";
	$data = $am->db->fetch_row($sql, array($channel_number));
	$list = $am->db->fetch("SELECT channel_number FROM sxm_channels ORDER BY channel_number");
	
	
	if(sizeof($data)){
		$data['web'] = intval($data['web']);
		$res = array(
			'channel' => $data,
			'channelList' => $list,
		);
	}else{
		$res = array();
	}
}

if($ACTION == 'update-channel'){
	
	$cm = new Model("sxm_channels", "channel_number");
	
	if(!empty($_POST['channel_number']) && !empty($_POST['channel_key']) && !empty($_POST['channel_name'])){
		
		if($_POST['add']){
			
			// Figure out if we already have this channel...
			$current_channel = $cm->db->fetch_value("SELECT count(*) as ct FROM sxm_channels WHERE channel_number=?", array($_POST['channel_number']));
			if($current_channel){
				$res = array(
					'channelExists' => true
				);
			}else{
				$cm->load($_POST['channel_number']);
				$insert_data = array(
					'channel_number' => trim($_POST['channel_number']),
					'channel_name' => trim($_POST['channel_name']),
					'channel_key' => trim($_POST['channel_key']),
					'web' => trim($_POST['web']),
				);
				$success = $cm->insert($insert_data) ? true : false;
				$res = array(
					'data' => $cm->data,
					'success' => $success,
				);
			}
		}else{
			$cm->load($_POST['channel_number']);
			if($cm->data){
				$update_data = array(
					'channel_number' => trim($_POST['channel_number']),
					'channel_name' => trim($_POST['channel_name']),
					'channel_key' => trim($_POST['channel_key']),
					'web' => trim($_POST['web']),
				);
				$success = $cm->update($update_data) ? true : false;
				$res = array(
					'data' => $cm->data,
					'success' => $success,
				);
			}elseif($_POST['number_changed'] && $_POST['old_number']){
				$cm->load($_POST['old_number']);
				$cm->delete();
				$insert_data = array(
					'channel_number' => trim($_POST['channel_number']),
					'channel_name' => trim($_POST['channel_name']),
					'channel_key' => trim($_POST['channel_key']),
					'web' => trim($_POST['web']),
				);
				$success = $cm->insert($insert_data) ? true : false;
				$res = array(
					'data' => $cm->data,
					'success' => $success,
				);
			}else{
				die("Did not get what we needed to hit the block: Number_changed and old_number");
			}
		}
	}
}



// Ping sirius API endpoint to indicate if the ChannelKey worked.
if($ACTION == 'test-channel'){
	
	if($_POST['channelKey']){
		$url = "http://player.siriusxm.com/rest/v2/experience/modules/get/deeplink?deepLinkId=".$_POST['channelKey']."&deepLink-type=live";
	}else{
		die("NEED TO PASS A URL!");
	}
	$options = array(
		CURLOPT_RETURNTRANSFER => true,   // return web page
		CURLOPT_HEADER         => false,  // don't return headers
		CURLOPT_FOLLOWLOCATION => true,   // follow redirects
		CURLOPT_MAXREDIRS      => 10,     // stop after 10 redirects
		CURLOPT_ENCODING       => "",     // handle compressed
		CURLOPT_USERAGENT      => "test", // name of client
		CURLOPT_AUTOREFERER    => true,   // set referrer on redirect
		CURLOPT_CONNECTTIMEOUT => 120,    // time-out on connect
		CURLOPT_TIMEOUT        => 120,    // time-out on response
	);
	$ch = curl_init($url);
	curl_setopt_array($ch, $options);
	$content  = curl_exec($ch);
	curl_close($ch);
	$res = json_decode($content);
	
	$code		 = $res->ModuleListResponse->messages[0]->code;
	$message = $res->ModuleListResponse->messages[0]->message;
	$success = intval($code) == 100;
	
	$cut = $res->ModuleListResponse->moduleList->modules[0]->moduleResponse->moduleDetails->liveChannelResponse->liveChannelResponses[0]->markerLists[0]->markers[0]->cut;
	$channel = $res->ModuleListResponse->moduleList->modules[0]->moduleResponse->moduleDetails->liveChannelResponse->liveChannelResponses[0]->channel;
	
	$album_title = !empty($cut->album) ? $cut->album->title : 'No Album';
	
	$res = array(
		
		'success' => $success,
		
		// Channel data
		'channelNumber' => intval($channel->channelNumber),
		'channelKey' => $channel->deepLinkId,
		'channelName' => $channel->name,
		
		// Print out for table
		'nowPlaying' => array(
			'title' => $cut->title,
			'album' => $album_title,
			'artist' => $cut->artists[0]->name,
		),
		
		// Necessary?
		// 'message' => $message,
		// 'code' => $code,
	);
}

if($ACTION == 'delete'){
	if(!empty($_POST['channel_number'])){
		$channel_number = intval($_POST['channel_number']);
		$model = new Model('sxm_channels', 'channel_number');
		$model->load($channel_number);
		$row_ct = $model->delete();
		$res = array(
			'success' => $row_ct >= 1 ? true : false,
			'instructions' => 'Delete operation concluded. Success Count: '.$row_ct,
		);
	}
}