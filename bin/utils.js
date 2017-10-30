class Utils{
	getRandomInt(min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	getRandomNumber(min, max){
		return Math.random() * (max - min) + min;
	}

	createTimezoneString(time_stamp) {
		var abs_value = Math.abs(time_stamp);
		var string = (abs_value < 10) ? ("0" + abs_value) + ":00" : abs_value + ":00";

	    return (time_stamp < 0) ? "+" + string : "-" + string;
	}

	createTimeString(time){
		var string = time.toISOString();
		return string.substring(0, string.length - 5)
	}
}

module.exports = new Utils();