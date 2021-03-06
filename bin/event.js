const rl_cdf = require( 'distributions-rayleigh-cdf' );
const exp = require( 'distributions-exponential' )();

const utils = require('./utils.js');

class Event{
	constructor(conf_reader){
		this.starting_time = utils.getRandomNumber(0,24) % 24;

		this.duration = utils.getRandomNumber((conf_reader.val("events:min_duration") || 0), (conf_reader.val("events:max_duration") || 1));

		this.occupation = utils.getRandomNumber((conf_reader.val("events:min_occupation") || 0), (conf_reader.val("events:max_occupation") || 1));

		//Init values for lambda (Exponential) and sigma (Rayleigh)
		this.min_lambda = conf_reader.val("events:min_lambda") || 0.5;
		this.max_lambda = conf_reader.val("events:max_lambda") || 2;
		this.lambda_var = conf_reader.val("events:lambda_var") || 0.07;

		this.min_sigma = conf_reader.val("events:min_sigma") || 0.05;
		this.max_sigma = conf_reader.val("events:max_sigma") || 1;
		this.sigma_var = conf_reader.val("events:sigma_var") || 0.04;
		
		///Random starting values for lambda and sigma
		this.lambda = utils.getRandomNumber(this.min_lambda, this.max_lambda);
		this.sigma = utils.getRandomNumber(this.min_sigma, this.max_sigma);

		this.last_sl_change = 0;

		this.change_interval = (conf_reader.val("events:change_rate") || 1)/60;

	}

	/*
		Take one step within the event
		At the start of an event the amount of people should ramp up quickly (CDF Rayleigh) and at the end people leave slowly (PDF Exponential).
	*/
	takeStep(x){
		//Start time of event
		let shifted_x = (x - this.starting_time) % 24;
		//End time of event
		let shifted_end_x = (shifted_x - this.duration) % 24;

		let rate = 0;

		//Check if it is time to change the distribution variables

		if(shifted_x >= 0 && shifted_end_x < 0){
			if(this.checkIfTimeToChange(x)){
				this.sigma += utils.getRandomNumber(-this.sigma_var, this.sigma_var);
				this.sigma = this.sigma > this.max_sigma ? this.max_sigma : this.sigma;
				this.sigma = this.sigma < this.min_sigma ? this.min_sigma : this.sigma;
				this.last_sl_change = x;
			}
			rate = rl_cdf(shifted_x, { 'sigma': this.sigma });
		}
		else if(shifted_end_x >= 0){
			if(this.checkIfTimeToChange(x)){
				this.lambda += utils.getRandomNumber(-this.lambda_var, this.lambda_var);
				this.lambda = this.lambda > this.max_lambda ? this.max_lambda : this.lambda;
				this.lambda = this.lambda < this.min_lambda ? this.min_lambda : this.lambda;
				this.last_sl_change = x;
			}
			exp.rate(this.lambda);
			rate = exp.pdf([shifted_end_x])[0] / this.lambda;
		}

		return rate * this.occupation;
	}

	checkIfTimeToChange(x){
		return Math.abs(x - this.last_sl_change) > this.change_interval;
	}
}

module.exports= Event;