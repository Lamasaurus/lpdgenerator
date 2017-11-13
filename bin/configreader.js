'use strict';

const fs = require('fs');

//A very simplistic configuration file reader
class ConfigReader{
	constructor(){
		this.config_file = process.argv.length < 3 ? {} : JSON.parse(fs.readFileSync(process.argv[2]));
	}

	val(val_name){
		return this.config_file[val_name];
	}
}

module.exports = new ConfigReader();