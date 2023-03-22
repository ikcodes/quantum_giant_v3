<?php
class Singleton {

  private static $_instances = array();
  
  // Disables the 'clone' operation
  private function __clone() {}
  
  protected function __construct(){}
  
  public static function getInstance($class='')
	{
		if(empty($class)) {
			// PHP > 5.3 only
			$class = get_called_class();
		}
    
    if (!isset(self::$_instances[$class])){
      self::$_instances[$class] = new $class;
    }
    return self::$_instances[$class];
  }

}
?>
