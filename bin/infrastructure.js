'use strict';

const PD = require("probability-distributions");
const chi = require('chi-squared');
const rl_cdf = require( 'distributions-rayleigh-cdf' );
const exp = require( 'distributions-exponential' )();

const utils = require('./utils.js');

class Parking{
	constructor(num, conf_reader){
		this.num = num;

		let min_spaces = conf_reader.val("parkings:min_spaces") || 100;
		let max_spaces = conf_reader.val("parkings:max_spaces") || 100;

		this.num_spaces = utils.getRandomInt(min_spaces, max_spaces);

		this.occupied_spaces = 0;
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
		/*var shifted_x = (x + 11) % 24;
		var shifted_end_x = (shifted_x + 22) % 24;
		
		console.log("New Rate", x, shifted_x, shifted_end_x);

		var rate = exp.pdf([shifted_end_x])[0];
		console.log(exp.pdf([shifted_end_x])[0]);

		rate -= rl_cdf(shifted_x);
		console.log(rl_cdf(shifted_x));


		this.occupied_spaces = Math.round(rate  * this.num_spaces) * 1;
		console.log(this.free_spaces);*/
	}
}

class City{
	constructor(num, conf_reader){
		this.parkings = [];
		this.num = num;

		let min_parks = conf_reader.val("parkings:min_num_per_city") || 1;
		let max_parks = conf_reader.val("parkings:max_num_per_city") || 2;
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