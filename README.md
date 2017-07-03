# Princeton University Student Origins

## Interactive map of the origins of students between 1748 and 1865.

**Extra tools required:**
- rake
- ogr2ogr
- unzip
- nodejs
- topojson (v1)
- xlsx

<code>rake</code>, <code>ogr2ogr</code>, <code>unzip</code>, and <code>nodejs</code> can be installed via the package manager.

<code>topojson</code> must be installed via <code>nodejs</code> (<code>npm -g topojson@1</code>); <code>xlsx</code> is also installed via <code>nodejs</code>.

The name of the student data spreadsheet must be correctly specified in the Rakefile.

To generate the .json files, do "<code>rake clean</code>" then "<code>rake</code>"; any missing geometry files will be automatically downloaded.

Styling is done via the <code>index.html</code> file (could be moved to a dedicated .css file if desired).

Modifications to the size of the map, positioning of elements, etc is done via the variables at the top of the <code>visualization.js</code> file.

Based on the "Historical Boundaries of the United States" project by Lincoln A. Mullen (http://lincolnmullen.com/projects/us-boundaries/)
Created for the Princeton & Slavery project.
