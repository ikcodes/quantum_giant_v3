<?php
class Database extends Singleton {

	public $dbo;

	public function __construct()
	{
		$config = Registry::getInstance();
		$dsn = "mysql:host=".$config->get('db_host').";dbname=".$config->get('db_name').";charset=utf8";
		$this->dbo = new PDO($dsn, $config->get('db_user'), $config->get('db_pass'), array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'"));
	}

	public function query($sql, $params)
	{
	 $table_exists_chk = false;
	 if(isset($params['table_exists'])) {
		 unset($params['table_exists']);
		 $table_exists_chk = true;
	 }
    $stmt = $this->dbo->prepare($sql);
    $i = 0;
    foreach($params as $p){
			
			// Pretty lame that bindValue doesn't already do this
			if(is_int($p)){
				$param = PDO::PARAM_INT;
			}
			elseif(is_bool($p)){
				$param = PDO::PARAM_BOOL;
			}
			elseif(is_null($p)){
				$param = PDO::PARAM_NULL;
			}
			elseif(is_string($p)){
				$param = PDO::PARAM_STR;
			}
			else{
				$param = FALSE;
			}
			
      $stmt->bindValue(++$i, $p, $param);
		}

		$result = $stmt->execute();
		if($table_exists_chk) {
			if($result) {
				return TRUE;
			}
			else {
				return FALSE;
			}
		}
		else {
			if($result){
				return $stmt;
			}
			else{
				return FALSE;
			}
		}
		
	}
	
	public function fetch($sql, $params=array())
	{
    $stmt = $this->query($sql, $params);
		if($stmt){
    	return $stmt->fetchAll();
		}
		else{
			return array();
		}
	}
	
	public function fetch_row($sql, $params=array())
	{
		$res = $this->fetch($sql, $params);
		return $res[0] ? $res[0] : FALSE;
	}
	
	public function fetch_value($sql, $params=array())
	{
    $stmt = $this->query($sql, $params);
		if($stmt){
    	return $stmt->fetchColumn();
		}
		else{
			return FALSE;
		}
	}
	
	public function update($sql, $params=array())
	{
	  $stmt = $this->query($sql, $params);
		if($stmt){
			return $stmt->rowCount();
		}
		else{
			return FALSE;
		}
	}

	// Delete function is duplicate of update, just added for semantics
	public function delete($sql, $params=array())
	{
	  $stmt = $this->query($sql, $params);
		if($stmt){
			return $stmt->rowCount();
		}
		else{
			return FALSE;
		}
	}
	
	public function insert($sql, $params=array())
	{
		$stmt = $this->query($sql, $params);
		if($stmt){
	  	return $this->dbo->lastInsertId();
		}
		else{
			return FALSE;
		}
	}
	
	public function count($sql, $params=array())
	{
		$stmt = $this->query($sql, $params);
		if($stmt){
    	return $stmt->fetchAll();
		}
		else{
			return array();
		}
	}

}
?>
