<?php
class Registry extends Singleton {

	private $data = array();

	public function get($key)
	{
		return isset($this->data[$key]) ? $this->data[$key] : FALSE;
	}

	public function set($key, $val)
	{
		$this->data[$key] = $val;
	}

}
?>
