queue()
.defer(d3.json, "us.json")
.defer(d3.json, "coast.json")
.await(ready);

//// variables

// map elements

var mapMargin=[10,20,10,20]; // top, right, bottom, left
var mapOuterSize=[960,500]; // width, height
var mapMaxZoom=4;
var mapScale=1050; // don't know the units

// slider elements

var sliderHeight=20;
var sliderStart=new Date(1748,1,1);
var sliderEnd=new Date(1865,1,1);
var sliderNote=new Date(1783,1,1);

// legend elements

var legendMargin=[10,5,10,5]; // top, right, bottom, left
var legendOuterSize=[165,270];
var legendScaleSize=[20,170];
var legendScaleRange=[0,40];
var legendScaleSteps=10; // 10 colors, plus a custom one for zero
var legendScaleZeroColor=[250,250,250];
var legendScaleColors=[[255,240,230],[255,150,0]];
var legendCornerRadius=10;
var legendDateFormat=d3.time.format("%Y");


//// derived variables

// map elements

var mapSize=[mapOuterSize[0]-mapMargin[3]-mapMargin[1], mapOuterSize[1]-mapMargin[0]-mapMargin[2]];

// legend elements

var legendSize=[legendOuterSize[0]-legendMargin[3]-legendMargin[1], legendOuterSize[1]-legendMargin[0]-legendMargin[2]];
var legendLocation=[mapSize[0]-legendSize[0]+10,mapSize[1]-legendSize[1]-10]; // right- and bottom-justified
var legendScaleStep=(legendScaleSteps)/legendScaleRange[1];
var legendDate=sliderStart;
var legendScaleLevels=[]

//// setup

var currentUnit = d3.select(null);

// create map
var svg = d3.select("#viz").append("svg")
.attr("width", mapOuterSize[0])
.attr("height", mapOuterSize[1])
.append("g")
.attr("transform", "translate(" + mapMargin[3] + "," + mapMargin[0] + ")")
.on("click", stopped, true);

// data is already projected, but this will allow dynamic resizing of the map
var projection = d3.geo.albers()
.scale(mapScale)
.translate([ 0.5 * mapSize[0], 0.5 * mapSize[1]]);

var path = d3.geo.path()
.projection(projection);

// create slider
var slider_svg = d3.select("#slider").append("svg")
.attr("width", mapOuterSize[0])
.attr("height", sliderHeight + mapMargin[0] + mapMargin[2])
.append("g")
.attr("transform", "translate(" + mapMargin[3] + "," + mapMargin[0] + ")");

// create tooltip
var tooltip = d3.select("#viz").append("div")
.classed("tooltip", true)
.classed("hidden", true);

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, mapMaxZoom])
    .on("zoom", zoomed);

// svg
//     .call(zoom) // delete this line to disable free zooming
//     .call(zoom.event);

svg.append("rect")
.attr("class", "background")
.attr("width", mapSize[0])
.attr("height", mapSize[1])
.on("click", reset);


function ready(error, us, coast) { 

	var states = topojson.feature(us, us.objects.states);
	var coastline  = topojson.feature(coast, coast.objects.coast);

	svg
	.selectAll(".coast")
	.data(coastline.features)
	.enter()
	.append("path")
	.attr("class", "coast")
	.attr("d", path);

	svg
	.selectAll(".unit")
	.data(states.features)
	.enter()
	.append("path")
	.attr("class", function(d) { 
	return "unit " + d.id;
	})
	.attr("d", path)
	.on("click", clicked);

	// Slider

	var x = d3.time.scale()
	.domain([sliderStart, sliderEnd])
	.range([0, mapSize[0]])
	.clamp(true);


	var brush = d3.svg.brush()
	.x(x)
	.extent([0, 0])
	.on("brush", brushed);

	slider_svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + sliderHeight / 2 + ")")
	.call(d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(function(d) { return d.getFullYear(); })
		.tickSize(0)
		.tickPadding(12));

	var slider = slider_svg.append("g")
	.attr("class", "slider")
	.call(brush);

	slider.selectAll(".extent,.resize")
	.remove();

	slider.select(".background")
	.attr("height", sliderHeight);

	var handle = slider.append("circle")
	.attr("class", "handle")
	.attr("transform", "translate(0," + sliderHeight / 2 + ")")
	.attr("r", 9);

	slider
	.call(brush.event)
	.call(brush.extent([legendDate, legendDate]))
	.call(brush.event);


	// create dynamic heat levels
	createClass(".heatLevel0","fill: rgb("+legendScaleZeroColor.toString()+");");
	legendScaleLevels[0]=legendScaleZeroColor;

	genlegendScaleLevels(legendScaleColors[0],legendScaleColors[1],legendScaleSteps)

	// create box for legend
	svg.append("g").append("rect")
	.classed("legend", true)
	.attr("x", legendLocation[0])
	.attr("y", legendLocation[1])
	.attr("width", legendOuterSize[0])
	.attr("height", legendOuterSize[1])
	.attr("rx",legendCornerRadius)
	.attr("ry",legendCornerRadius)

	// create year indicator for legend
	svg.append("g").append("text")
	.classed("date-label", true)
	.classed("map-label", true)
	.attr("text-anchor", "start")
	.attr("x", legendLocation[0]+legendMargin[3])
	.attr("y", legendLocation[1]+legendMargin[0]+10)
	.text(dateLabel(legendDate));

	// create north students indicator for legend
	svg.append("g").append("text")
	.classed("n-label", true)
	.classed("map-label", true)
	.attr("text-anchor", "start")
	.attr("x", legendLocation[0]+legendMargin[3])
	.attr("y", legendLocation[1]+legendMargin[1]+legendScaleSize[1]+65)
	.text("North: 4 (100.00%)");

	// create south students indicator for legend
	svg.append("g").append("text")
	.classed("s-label", true)
	.classed("map-label", true)
	.attr("text-anchor", "start")
	.attr("x", legendLocation[0]+legendMargin[3])
	.attr("y", legendLocation[1]+legendMargin[1]+legendScaleSize[1]+85)
	.text("South: 0 (0.00%)");

	// create scale for legend
		
	var legend = svg.append("g");

	for(k = 0; k <= legendScaleSteps; k++) {
		var heatstr="rgb("+legendScaleLevels[k]+")";
		legend
		.append("rect")
		.classed("unit", true)
		.classed("active", true)
		.classed("heatLevel"+k, true)
		.attr("width", legendScaleSize[0])
		.attr("height", legendScaleSize[1]/legendScaleSteps)
		.attr("x", legendLocation[0]+legendMargin[3]+10)
		.attr("y", legendLocation[1]+legendMargin[3]+25+legendScaleSize[1]-Math.round(k*legendScaleSize[1]/legendScaleSteps))
		.style("stroke","rgb("+legendScaleLevels[k].toString()+")")
		.style("stroke","rgb(0,0,0)");

		// add labels to top and bottom of scale
		if (k==0 || k==legendScaleSteps) {
			legend
			.append("text")
			.classed("map-label", true)
			.attr("x", legendLocation[0]+legendScaleSize[0]+legendMargin[3]+15)
			.attr("y", legendLocation[1]+legendMargin[3]+40+legendScaleSize[1]-Math.round(k*legendScaleSize[1]/legendScaleSteps))
			.attr("text-anchor", "start")
			.text(Math.round(k/legendScaleStep)+" Students");
		}
	}
          
	// create note indicator
	svg.append("g").append("text")
	.classed("exp-label", true)
	.classed("map-label", true)
	.attr("text-anchor", "start")
	.attr("x", mapSize[0] - 460)
	.attr("y", mapSize[1] - 15)
	.text("*1783 state borders are used pre-1783.");

	// heart of the code
	// detects slider clicks and mouseovers, and updates the map accordingly
	function brushed() {
		
		// get click location
		var value = brush.extent()[0];

		if (d3.event.sourceEvent) { // not a programmatic event
			value = x.invert(d3.mouse(this)[0]);
			brush.extent([value, value]);
		}
	
		// set slider location
		handle.attr("cx", x(value));

		// update the date in the legend
		svg.selectAll(".date-label").text(dateLabel(value));

		// get the north and south totals
		var north=svg
		.selectAll(".unit")
		.data(states.features)
		.filter(function(d) { return d.properties.ID=="ak_state";})[0][0].__data__;

		var south=svg
		.selectAll(".unit")
		.data(states.features)
		.filter(function(d) { return d.properties.ID=="hi_state";})[0][0].__data__;

		var snorth=students(north,value);
		var ssouth=students(south,value);

		// do the update
		svg.selectAll(".n-label").text("North: "+snorth+" ("+(snorth/(snorth+ssouth)*100).toFixed(2)+"%)");
		svg.selectAll(".s-label").text("South: "+ssouth+" ("+(ssouth/(snorth+ssouth)*100).toFixed(2)+"%)");

		// connect svg elements to their data
	    svg.selectAll(".unit")
	    .data(states.features)
	    
		// determine if state should be active now
	    .classed("active", function(d) {
			return (new Date(d.properties.START_DATE)) <= value && value <= (new Date(d.properties.END_DATE));
	    })
		// determine the color to make a state based on the number of students
		// only adds and removes the legend colors
		.attr("class",function(d) {
			var ns=students(d,value);
			var curheat=Math.ceil(students(d,value)*legendScaleStep);
			if (ns==0) {
				curheat=0;
			}
			var curclasses=d3.select(this).attr("class").replace(/heatLevel[0-9]*/g,'');
			var newclasses=curclasses+" heatLevel"+curheat;
			return newclasses;
		})
		// shows and hides tooltip based on mouse movement
		.on("mousemove", function(d, i) {
			var mouse = d3.mouse(d3.select("body").node());

			tooltip.classed("hidden", false)
			.attr("style", "left:" + (mouse[0] + 10) +"px; top:" + (mouse[1] - 100) + "px")
			.html(
				"<h4>" + d.properties.FULL_NAME + "</h4><p><strong>Students:</strong> " +
				students(d,value)
				+ "</p><p><strong>Cumulative:</strong> " +
				cstudents(d,value)+"</p>"
			);
		})
		.on("mouseout", function(d, i) {
			tooltip.classed("hidden", true);
		});
	}
}  

//// utilty functions

// insert new classes into the stylesheet
function createClass(name,rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
        (style.styleSheet || style.sheet).addRule(name, rules);
    else
        style.sheet.insertRule(name+"{"+rules+"}",0);
}

// dynamically create classes with fill property interpolated from given starting colors
function genlegendScaleLevels(start, end, num) {
	var incr=(end[0]-start[0])/num;
	var incg=(end[1]-start[1])/num;
	var incb=(end[2]-start[2])/num;
	for(k = 1; k <= num; k++) {
		cur=[Math.round(start[0]+k*incr),Math.round(start[1]+k*incg),Math.round(start[2]+k*incb)];
		createClass(".heatLevel"+k.toString(),"fill: rgb("+cur.toString()+");");
		legendScaleLevels[k]=cur;
	}
}

// turn note on and off depending on the date
function dateLabel(year) {
	if (year<sliderNote) {
		svg.selectAll(".exp-label").classed("hidden",false);
		return "Year: "+niceDate(year)+"*";
	} else {
		svg.selectAll(".exp-label").classed("hidden",true);
		return "Year: "+niceDate(year);
	}
}

// format the date to be displayed in the legend
function niceDate(date) {
	return legendDateFormat(new Date(date))
}

// retrieve the number of students for the current year from the specified state data string
function students(d,curdate) {
	if (d.properties.students) {
		var dateloc=d.properties.students.search(niceDate(curdate));
		if (dateloc > -1) {
			return Number(d.properties.students.substr(dateloc+5,3));
		} else { return "0";}
	} else {return "0";}
}

// adds numbers in a string
function addbits(s){
    var total= 0, s= s.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];
    while(s.length){
        total+= parseFloat(s.shift());
    }
    return total;
}

// retrieve the cummulative number of students for the current year from the specified state data string
function cstudents(d,curdate) {
	if (d.properties.students) {
		var dateloc=d.properties.students.search(niceDate(curdate));
		var cstudent= d.properties.students;
		var csmatch=cstudent.match(/[0-9]{4}/g);
		var breakdate="0";
		for (k=0;k<csmatch.length;k++) {
			if (csmatch[k]>niceDate(curdate) && k==0) {
				return "0";
			}
			if (csmatch[k]>niceDate(curdate) && k>0) {
				breakdate=csmatch[k-1];
				break;
			}
			if (k==csmatch.length-1) {
				breakdate="all";
				break;
			}
		}
		if (breakdate=="0") {
			return "0";
		}
		if (breakdate!="all") {
			var repstr="("+breakdate+":[0-9]*).*";
			cstudent=cstudent.replace(new RegExp(repstr),"$1");
		}
		cstudent=cstudent.replace(/[^,]?[0-9]*:/g,"+");
		cstudent=cstudent.replace(/,/g,"");
		return addbits("0"+cstudent);
	} else {return "0";}
}


// handles zooming
function clicked(d) {
	if (currentUnit.node() === this) return reset();
	currentUnit.classed("current", false);
	currentUnit = d3.select(this).classed("current", true);

	var bounds = path.bounds(d),
	dx = bounds[1][0] - bounds[0][0],
	dy = bounds[1][1] - bounds[0][1],
	x = (bounds[0][0] + bounds[1][0]) / 2,
	y = (bounds[0][1] + bounds[1][1]) / 2,
	scale = Math.min(0.75 / Math.max(dx / mapSize[0], dy / mapSize[1]), mapMaxZoom),
	translate = [mapSize[0] / 2 - scale * x, mapSize[1] / 2 - scale * y];

	svg.transition()
	.duration(750)
	.call(zoom.translate(translate).scale(scale).event);
}

// reset after zooming
function reset() {
	currentUnit.classed("current", false);
	currentUnit = d3.select(null);

	svg.transition()
	.duration(750)
	.call(zoom.translate([0, 0]).scale(1).event);
}

// adjust the thickness of lines when zooming
function zoomed() {
	var scale = Math.min(5, d3.event.scale);
	svg.selectAll(".unit").style("stroke-width", 1.0 / d3.event.scale + "px");
	svg.selectAll(".coast").style("stroke-width", 0.9 / d3.event.scale + "px");
	svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
	if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

