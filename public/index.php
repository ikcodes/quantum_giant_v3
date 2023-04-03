<?php /*

All requests to the server, including 
the API, flow through here. ALL requests
require the cookie given at login. Requests
without the cookie are direcred to /login.

THIS FILE JUST PERFORMS ROUTING.
For global markup, see index.html

============================================*/

$DEBUG = 0;

// Dependencies 
$SPA_MARKUP = file_get_contents('template/index.html');	// npm run build from local proj root. Paths to dependencies are also from root.
require_once('includes/classes/Singleton.php');
require_once('includes/classes/Registry.php');
require_once('includes/classes/Database.php');
require_once('includes/classes/Model.php');
require_once('includes/helper-functions.php');
require_once('includes/helper-functions-catalog.php');
require_once('config.php');


//===========================================================
// -->	USER LOGIN MANAGEMENT
//===========================================================
session_start();
if(!empty($_POST)){
	if(!empty($_POST['username'] && !empty($_POST['wordpass']))){
	
		// Quick anti-SQL injection stuff.
		$username = trim(substr($_POST['username'], 0, 50));
		$password = trim(substr($_POST['wordpass'], 0, 50));
		$user = verifyUser($username, $password);
		
		if(empty($user)){
			die("We don't have a login :(");
		}else{	// Bingo
			$_SESSION['user_id'] = $user['id'];
			// $_SESSION['user_fname'] = $user['first_name'];
			
			// Redirect user if previously requested URL was blocked via login
			if(isset($_SESSION['prev_url'])){
				$prev_url = $_SESSION['prev_url'];
				unset($_SESSION['prev_url']);
				$redi_url = $_SERVER['HTTP_ORIGIN'] . implode('/', $prev_url);
				$header_loc = "Location: ".$redi_url;
				header($header_loc);	// Redirect to where they was goin'
			}else{
				header('Location:/');
			}
			die;
		}
	}
}

//=====================
// 	--> ROUTING
//=====================
$url = explode('/', $_SERVER['REQUEST_URI']);

// Logging out? Bye bye.
if($url[1] == 'logout'){
	session_unset();
	header('Location:/login');
	die;
}

// API request? You'll need some vars.
$api_request = $url[1] == 'api';
if($api_request){
	$api_directory = $config->get('api_directory');
	$api_endpoint = __DIR__.$api_directory.$url[2].'.php';
	$ACTION = !empty($url[3]) ? $url[3] : '';	// This var checked in API files
}

//================================
//	-->	API REQUEST: echo JSON
//================================
if($api_request && !empty($ACTION)){	// CURRENTLY UNGATED!
	
	header("Content-type: application/json");
	$rest_json = file_get_contents("php://input");
	$_POST = json_decode($rest_json, true);
	
	require_once($api_endpoint);	// Assigns value to $res & passes through
	
	// MARKUP ECHOED INTO WEBSCAPE:
	//=============================
	$origin  = $_SERVER['HTTP_ORIGIN'];
	$allowed_origins = array(
		'https://quantumgiants.com',
		'https://www.800poundgorillarecords.com',
	);
	$invalid_req = !in_array($origin, $allowed_origins);
	if($invalid_req || !isset($res) || empty(array_values($res))){
		die(json_encode($res));
	}else{
		header("Access-Control-Allow-Origin: *");
		die(json_encode($res));
	}
}

if($DEBUG && !$api_request){
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
}

//================================================
//  --> MARKUP REQUEST - OUTPUT BUFFER APP MARKUP
//================================================
ob_start();
if(isset($_SESSION['user_id'])){
	// echo "<p>" . $_SESSION['user_fname'] . " is logged in!</p>";
	// echo "<!-- URL: " . implode(' - / - ', $url) ." -->";
	// echo "<!-- OH, HELLO -->";
	echo $SPA_MARKUP;
}else{
	$_SESSION['prev_url'] = $url;
	require_once('includes/login.php');
}

echo ob_get_clean();
die;


//================================================
//  -->  HELPER FUNCTIONS
//================================================

function connectToMysql(){	// ... Could these use the Model?
	$config = Registry::getInstance();
	$mysqli = new mysqli($config->get('db_host'), $config->get('db_user'), $config->get('db_pass'), $config->get('db_name'));
	if ($mysqli->connect_errno) {
		echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
		die;
	}
	return $mysqli;
}

function verifyUser($user, $pass){
	$mysqli = connectToMysql();
	$query = "SELECT * FROM users WHERE username='$user' AND wordpass='$pass'";
	$user_data = array();
	if ($result = $mysqli->query($query)) {
		while ($row = $result->fetch_assoc()) {
			$user_data[] = $row;
		}
		$result->free();
		if(!empty($user_data)){
			return $user_data[0];	// 0-indexed arr of 1 user
		}else{
			die("Invalid login!");
		}
	}else{
		die("Invalid query!");
	}
}