'use strict';

const N3 = require('n3');
const N3Util = N3.Util;

const fs = require('fs');

const http = require('http');
const url = require('url') ;

const infrastructure = require('./infrastructure.js');
const utils = require('./utils.js');

class ConfigReader{
	constructor(){
		this.config_file = process.argv.length < 3 ? {} : JSON.parse(fs.readFileSync(process.argv[2]));
	}

	val(val_name){
		return this.config_file[val_name];
	}
}

const conf_reader = new ConfigReader();



class Generator{
	constructor(){
		this.num_cities = conf_reader.val("cities:number") || 1;

		this.cities = [];

		for (var i = 0; i < this.num_cities; i++){
			var new_city = new infrastructure.City(i, conf_reader);
			this.cities.push(new_city);
		}

		if(conf_reader.val("time:start"))
			this.starting_time = new Date(conf_reader.val("time:start")) 
		else
			this.starting_time = new Date("1970-01-01T00:00:00");

		if(conf_reader.val("time:end"))
			this.end_time = new Date(conf_reader.val("time:end"))
		else 
			this.end_time = new Date("1970-01-01T01:00:00");

		this.time_per_file = conf_reader.val("time:time_per_file") || 3600;
		this.time_interval = conf_reader.val("time:interval") || 30;

		this.output_meta_data = conf_reader.val("file:output_meta_data") || false;
		this.output_dir = conf_reader.val("file:output") || ".";
		this.file_extension = conf_reader.val("file:extension") || "";
	}

	//Generate the data for one city
	generateCity(city_n, start_time){

		// Initiate the N3 writer
		var writer = this.initWriter();

		//Select city and construct base uri
		var city = this.cities[city_n];
		var base_URI = "https://" + city.name + ".datapiloten.be/parking";

		this.num_triples = 0;

		//Initiate the time stamp, time of the current file and save the last time stamp that should be in this file
		var time_stamp = new Date(this.starting_time);
		this.current_file_time = new Date(this.starting_time);
		var next_end_of_file_time = new Date(this.starting_time);
		next_end_of_file_time.setSeconds(next_end_of_file_time.getSeconds() + this.time_per_file);
		
		

		//Write for every interval a status of the parkings
		for(time_stamp; time_stamp.getTime() < this.end_time.getTime(); time_stamp.setSeconds(time_stamp.getSeconds() + this.time_interval)){
			city.takeStep(time_stamp);

			
			//If the data for one file is generated, we need to write that file
			if(next_end_of_file_time.getTime() == time_stamp.getTime()){
				this.roundUpFile(city, base_URI, writer);
				writer.end((function (error, result) { this.outputFile(result, city); }).bind(this));
				writer = this.initWriter();

				//initiate new file times
				this.current_file_time = new Date(time_stamp);
				next_end_of_file_time = new Date(this.current_file_time);
				next_end_of_file_time.setSeconds(next_end_of_file_time.getSeconds() + this.time_per_file);
			}

			this.writeParkings(city, base_URI, time_stamp, writer);
		}

		this.roundUpFile(city, base_URI, writer);
		//Write the file
		writer.end((function (error, result) { this.outputFile(result, city); }).bind(this));
	}

	//Adds the static meta data at the end of the file
	roundUpFile(city, base_URI, writer){
		this.writeStaticData(city, base_URI, writer);

		if(this.output_meta_data){
			this.writeMetaData(base_URI, this.current_file_time, writer);
			this.writeNumTriples(base_URI, writer);
		}
	}

	//Requests the result of the N3 write and writes it to a file
	outputFile(result, city){
		var file_name = this.output_dir + "\\" + city.name + "-" + utils.createTimeString(this.current_file_time).replace(new RegExp(":", 'g'), "");

		if(this.file_extension)
			file_name += this.file_extension;

		fs.writeFile(file_name, result, (err) => {
		    if(err) {
		        return console.log(err);
		    }

		    console.log(file_name + " was saved!");
		}); 
	}

	//Start generating data for all cities
	generate(){
		for(var c in this.cities){
			this.generateCity(c);
		}
	}

	//Write the number of triples in the file
	writeNumTriples(base_URI, writer){
		writer.addTriple({
			graph: "#Metadata",
			subject: base_URI,
			predicate: "void:triples",
			object: N3Util.createLiteral(this.num_triples)
		});
	}

	//Initiate a new N3 writer
	initWriter(){
		return N3.Writer({ 	format: 'application/trig',
							prefixes: { 	datex: 'http://vocab.datex.org/terms#',
										schema: 'http://schema.org/',
										dct: 'http://purl.org/dc/terms/',
										geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
										owl: 'http://www.w3.org/2002/07/owl#',
										rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
										hydra: 'http://www.w3.org/ns/hydra/core#',
										void: 'http://rdfs.org/ns/void#',
										rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
										foaf: 'http://xmlns.com/foaf/0.1/',
										cc: 'http://creativecommons.org/ns#',
										mdi: 'http://w3id.org/multidimensional-interface/ontology#',
										time: 'https://www.w3.org/TR/owl-time/',
										ts: 'http://datapiloten.be/vocab/timeseries#',
							} 
						});
	}
 
	// Writes the meta data about the hydra mapping
	writeMetaData(base_URI, starting_time, writer){

		var time_prev = new Date(starting_time);
		time_prev.setSeconds(time_prev.getSeconds() - this.time_per_file);
		var time_next = new Date(starting_time);
		time_next.setSeconds(time_next.getSeconds() + this.time_per_file);

		writer.addTriple({
			graph: "#Metadata",
			subject: base_URI + "?page=" + utils.createTimeString(starting_time),
			predicate: "hydra:previous",
			object: base_URI + "?page=" + utils.createTimeString(time_prev)
		});

		writer.addTriple({
			graph: "#Metadata",
			subject: base_URI + "?page=" + utils.createTimeString(starting_time),
			predicate: "hydra:next",
			object: base_URI + "?page=" + utils.createTimeString(time_next)
		});

		writer.addTriple({
			graph: "#Metadata",
			subject: base_URI + "#dataset",
			predicate: "hydra:search",
			object: base_URI + "#search"
		});

		this.num_triples += 3;

		var hydra_mapping = ["subject", "property", "object"];

		for(var h in hydra_mapping){
			writer.addTriple({
				graph: "#Metadata",
				subject: base_URI + "#mapping" + hydra_mapping[h].charAt(0).toUpperCase(),
				predicate: "hydra:variable",
				object: N3Util.createLiteral(hydra_mapping[h].charAt(0))
			});

			this.num_triples += 1;
		}

		for(var h in hydra_mapping){
			writer.addTriple({
				graph: "#Metadata",
				subject: base_URI + "#mapping" + hydra_mapping[h].charAt(0).toUpperCase(),
				predicate: "hydra:property",
				object: N3Util.createLiteral(hydra_mapping[h])
			});

			this.num_triples += 1;
		}

		writer.addTriple({
			graph: "#Metadata",
			subject: base_URI + "#search",
			predicate: "hydra:template",
			object: N3Util.createLiteral(base_URI)
		});

		this.num_triples += 1;

		for(var h in hydra_mapping){
			writer.addTriple({
				graph: "#Metadata",
				subject: base_URI + "#search",
				predicate: "hydra:mapping",
				object: base_URI + "#mapping" + hydra_mapping[h].charAt(0).toUpperCase()
			});

			this.num_triples += 1;
		}
	}

	//Writes the static data about the parkings
	writeStaticData(city, base_URI, writer){
		for(var parking in city.parkings){
			writer.addTriple({
				subject: base_URI + "#"+city.parkings[parking].name,
				predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
				object: "datex:UrbanParkingSite"
			});

			writer.addTriple({
				subject: base_URI + "#"+city.parkings[parking].name,
				predicate: "rdfs:label",
				object: N3Util.createLiteral(city.parkings[parking].name)
			});

			writer.addTriple({
				subject: base_URI + "#"+city.parkings[parking].name,
				predicate: "datex:parkingNumberOfSpaces",
				object: N3Util.createLiteral(city.parkings[parking].spaces)
			});

			this.num_triples += 3;
		}
	}

	//Write the parking data
	writeParkings(city, base_URI, time_stamp, writer){

		//Write the number of free spaces in a graph object
		for(var parking in city.parkings){
			writer.addTriple({
				graph: base_URI + "?time=" + utils.createTimeString(time_stamp),
				subject: base_URI + "#"+city.parkings[parking].name,
				predicate: "datex:parkingNumberOfVacantSpaces",
				object: N3Util.createLiteral(city.parkings[parking].free_spaces)
			});

			this.num_triples += 1;
		}

		//Write when the data was generated (same as time stamp)
		writer.addTriple({
			subject: base_URI + "?time=" + utils.createTimeString(time_stamp),
			predicate: "http://www.w3.org/ns/prov#generatedAtTime",
			object: N3Util.createLiteral(utils.createTimeString(time_stamp) + utils.createTimezoneString(time_stamp.getTimezoneOffset() / 60), "http://www.w3.org/2001/XMLSchema#dateTime")
		});

		writer.addTriple({
			subject: base_URI + "?time=" + utils.createTimeString(time_stamp),
			predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
			object: "http://www.w3.org/ns/prov#Bundle"
		});

		writer.addTriple({
			subject: base_URI + "?time=" + utils.createTimeString(time_stamp),
			predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
			object: "http://www.w3.org/ns/prov#Entity"
		});

		this.num_triples += 1;
	}
}

var gen = new Generator();
gen.generate();