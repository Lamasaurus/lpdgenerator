'use strict';

const utils = require('./utils.js');
const Event = require('./event.js');

class Parking{
	constructor(num, conf_reader){
		this.num = num;

		let min_spaces = conf_reader.val("parkings:min_spaces") || 100;
		let max_spaces = conf_reader.val("parkings:max_spaces") || 100;

		this.num_spaces = utils.getRandomInt(min_spaces, max_spaces);

		this.occupied_spaces = 0;

		this.events = new Array();
		for(var i = utils.getRandomInt((conf_reader.val("events:min_events") || 0), (conf_reader.val("events:max_events") || 10)); i > 0; i--)
			this.events.push(new Event(conf_reader));
	}

	get name(){
		return 'parking' + this.num;
	}

	get spaces(){
		return this.num_spaces;
	}

	get free_spaces(){
		return this.num_spaces - this.occupied_spaces;
	}

	takeStep(x){
		let rate = 0;
		
		for(var i = 0; i < this.events.length; i++)
			rate += this.events[i].takeStep(x);


		rate = rate > 1 ? 1 : rate;
		this.occupied_spaces = Math.round(rate  * this.num_spaces);
	}
}

class City{
	constructor(num, conf_reader){
		this.parkings = new Array();
		this.num = num;

		let min_parks = conf_reader.val("parkings:min_num_per_city") || 1;
		let max_parks = conf_reader.val("parkings:max_num_per_city") || 1;
		this.num_parkings = utils.getRandomInt(min_parks, max_parks);

		for(var i = 0; i < this.num_parkings; i++){
			let p_num = num + '-' + i;
			this.parkings.push(new Parking(p_num, conf_reader));
		}
	}

	get name(){
		return 'city' + this.num;
	}

	takeStep(time, distribution){
		var x = time.getHours() + time.getMinutes()/60;
		for(var i = 0; i < this.num_parkings; i++){
			this.parkings[i].takeStep(x);
		}
	}
}

module.exports= {
	City: City,
	Parking: Parking
}