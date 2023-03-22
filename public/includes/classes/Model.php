<?php
class Model {

	public $db;
	public $table;
	public $data;
	public $id;
	public $keyfield;

	public function __construct($table='', $keyfield='id')
	{
		$this->table = $table;
		$this->keyfield = $keyfield;
		$this->db = Database::getInstance();
	}

	public function load($id, $keyfield = '')
	{
		if ($keyfield == '') {
			$keyfield = $this->keyfield;
		}
		$sql = "SELECT * FROM ".$this->table." WHERE ".$keyfield."=? LIMIT 1";
		$rows = $this->db->fetch($sql, array($id));
		if(!empty($rows)) {
			$this->data = $rows[0];
			$this->id = $rows[0][$keyfield];
		}
		else {
			$this->data = array();
			$this->id = 0;
		}
	}
	
	public function insert($fields)
	{
		$keys = array_keys($fields);
		$values = array_values($fields);
		
		$sql = "INSERT INTO ".$this->table." SET ";
		$sql .= implode('=?, ', $keys)."=?";
		
		return $this->db->insert($sql, $values);
	}
	
	public function update($fields)
	{
		$keys = array();
		$values = array();
		$affected = 0;
		
		if(!empty($this->id) && !empty($fields)) {
			
			$keys = array_keys($fields);
			$values = array_values($fields);
			
			$sql = "UPDATE ".$this->table." SET ";
			$sql .= implode('=?, ', $keys)."=?";
			$sql .= " WHERE ".$this->keyfield."=".$this->id;
			
			$affected = $this->db->update($sql, $values);
		}
		return $affected;
	}
	
	public function delete()
	{
		$affected = 0;
		
		if(!empty($this->id)) {
			$sql = "DELETE FROM ".$this->table." WHERE ".$this->keyfield."=".$this->id;
			$affected = $this->db->delete($sql);
			$this->id = 0;
			$this->data = array();
		}
		return $affected;
	}

	/* Values for use in the $args array:
	 * - params (array) - values for the placeholders in the WHERE statement
	 * - select (string) - the SELECT part of the query. defaults to "*"
	 * - from (string) - the FROM part of the query. defaults to $this->table
	 * - where (string) - the WHERE part of the query
	 * - order (string) - the ORDER BY part of the query
	 * - limit (string or array) - the LIMIT part of the query. If array, should contain keys 'start' and 'limit'
	 * - count_only (boolean) - if true, only returns the number of results
	 */
	
	public function get_items($args = array())
	{	
		
		// Params
		if (isset($args['params'])){
			if(is_array($args['params'])){
				$params = $args['params'];
			}else{
				$params = array($params);
			}
		}else{
			$params = array();
		}
		
		// Prepare query
		if(isset($args['count_only']) && $args['count_only']){
			$sql = "SELECT COUNT(*) AS num";
		}
		else {
			$sql = "SELECT ".(!empty($args['select']) ? $args['select'] : '*');
		}
		
		$sql .= " FROM ".(!empty($args['from']) ? $args['from'] : $this->table);
		
		if(!empty($args['where'])) {
			$sql .= " WHERE ".$args['where'];
		}
		if(!empty($args['group'])) {
			$sql .= " GROUP BY ".$args['group'];
		}
		if(!empty($args['order'])) {
			$sql .= " ORDER BY ".$args['order'];
		}
		if(!empty($args['limit'])) {
			if(is_array($args['limit'])) {
				$sql .= " LIMIT ?, ?";
				$params[] = $args['limit']['start'];
				$params[] = $args['limit']['limit'];
			} else {
				$sql .= " LIMIT ?";
				$params[] = $args['limit'];
			}
		}
		
		return ( (isset($args['count_only']) && $args['count_only']) ? $this->db->fetch_value($sql, $params) : $this->db->fetch($sql, $params) );
	}
	
	public function table_exists($alt_table = '')
	{
		$chk_table = ($alt_table != '') ? $alt_table : $this->table ;
		$sql = "SELECT 1 FROM ".$chk_table." LIMIT 1";
		$exists = $this->db->query($sql, array('table_exists' => true));
		return $exists;
	}
	
	public function sort($sort) {
		$i = 1;
		foreach($sort as $id){
			$sql = "UPDATE ".$this->table." SET sort=".$i." WHERE id=".$id." LIMIT 1";
			$affected = $this->db->update($sql);
			$i++;
		}
		return $sql;
	}
	
	public function get_paging_start($page_num, $per_page)
	{
		return (($page_num * $per_page) - $per_page);
	}

}
?>