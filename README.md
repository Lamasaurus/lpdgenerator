# lpdgenerator
Linked parking data generator, generates dumps of parking data in the form of linked data.

## Usage

```
const lpdgenerator = require('lpdgenerator');

var generator = new lpdgenerator();
var output_files = generator.generate();
```

This output_files is an array with elements of this structure:
```
{
	city // The city number that is described in this file
	file_time // The time that this file describes
	result // The linked data
}
```

## Input
There is an example input file in the root.

Name | Description | Default
--- | --- | ---
cities:number | The number of generated cities | 1
parkings:min_num_per_city | The minimum number of parkings per city | 1
parkings:max_num_per_city | The maximum number of parkings per city | 1
parkings:min_spaces | The minimum number of spaces per parking | 100
parkings:max_spaces | The maximum number of spaces per parking | 100
time:start | The time from which the generation starts | "1970-00-00T00:00:00"
time:end | The time at which the generation stops | "1970-00-00T01:00:00"
time:time_per_file | The amount of time that will be put in one file | 3600
time:interval | The interval at which the parkings get updated | 30
file:output | The output directory | ""
file:output_meta_data | Bool to see if meta data should be put in the file | false
file:extension | Defines the extension of the generated files | ""
file:name_format | Defines the format of the output filenames. `DEFAULT`: `city-YYYY-MM-DDThhmmss`, `UNIX`: UNIX timestamp of beginning of interval. | "DEFAULT"
file:split | If files of cities should be split, if false will ignore "time:time_per_file" | true
events:min_events | Minimum number of events within 24h | 0
events:max_events | Maximum number of events within 24h | 1
events:min_duration | Minimum duration of the events | 0
events:max_duration | Maximum duration of the events | 1
events:min_occupation | Minimum occupation of an event | 0
events:max_occupation | Maximum occupation of an event | 1