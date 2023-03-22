<?php
/******************************************************************* 
* Create registry object for config data.
* Access throughout application using $config->get('property_name')
*******************************************************************/
$config = Registry::getInstance();


/******************************************************************* 
 * THIS IS A SAMPLE FILE!
 * =======================
 * Of course you can't have the creds.
 * But you CAN spin up your own DB and plug in those creds below.
*******************************************************************/

$config->set('db_host', 'localhost');
$config->set('db_user', 'root');
$config->set('db_pass', 'root');
$config->set('db_name', $db_name);
$config->set('api_directory', '/routes/');