# lpdgenerator
Linked parking data generator, generates dumps of parking data in the form of linked data.

## Usage
node ./bin/generator.js <input-file>

## Input
Name | Description | Default
--- | --- | ---
cities:number | The number of generated cities | 1
parkings:min_num_per_city | The minimum number of parkings per city | 1
parkings:max_num_per_city | The maximum number of parkings per city | 1
parkings:min_spaces | The minimum number of spaces per parking | 100
parkings:max_spaces | The maximum number of spaces per parking | 100
time:start | The time from which the generation starts | 1970-00-00T00:00:00
time:end | The time at which the generation stops | 1970-00-00T01:00:00
time:time_per_file | The amount of time that will be put in one file | 3600
time:interval | The interval at which the parkings get updated | 30
file:output | The output directory | ""
file:output_meta_data | Bool to see if meta data should be put in the file | false
file:extension | Defines the extension of the generated files | ""
