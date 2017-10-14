
var usaTopoJson = "https://gist.githubusercontent.com/mbostock/4090846/raw/us.json";

var svg = d3.select("svg#map");
var plot = svg.append("g").attr("id", "plot");
// Placeholder for base group to be accessed by zoomed()
var baseMapSVG = plot.append("g").attr("id", "basemap")
											.attr("transform","translate(50,0)");

var baseOuter = baseMapSVG.append("g"); // The SVG to draw geographic shapes


// Bar chart svg
var barChartSVG = d3.select("svg#barchart")
						.attr("transform","translate(200,0)");

var barChartSVG2 = d3.select("svg#barchart2")
						.attr("transform","translate(200,0)");

var width  = +svg.attr("width")-50;
var height = +svg.attr("height");
// placeholder for click and zoom feature, 
// active state being zoomed on selector
var active = d3.select(null);

var projection = d3.geoAlbers();

// placeholder for state data once loaded
var states = null;

// Set up click and zoom feature
//This is actually free zoom? Note the svg.call(zoom) needed
var zoom = d3.zoom()
		.scaleExtent([1, 8])
		.on("zoom", zoomed);

// used for click and zoom feature
var path = d3.geoPath() // updated for d3 v4
		.projection(projection);

// Color scale
var stateColor = d3.scaleSequential(d3.interpolateYlOrRd)
								.domain([899.47,4042.25]);

// Color scale
// var countyColor = d3.scaleSequential(d3.interpolateRdPu)
// 								.domain([560.19,34358]);


var countyColor = d3.scaleLinear()
	.range([d3.rgb("#ccc1ff"),d3.rgb("#36229b")])
	.domain([570.15,33376.08])
	.interpolate(d3.interpolateHcl);

// var stateColor = d3.scaleLinear()
// 								.domain(d3.range(868.82, 4104))
// 								// .range(d3.schemeYlGnBu[10]);
// 								.range(["#FFFFE0","#8B0000"]);




// Call US Topojson and drawMap function
d3.json(usaTopoJson, drawMap);


toggleMapButton(barChartSVG);
/*
 *	Draw scales
 */

// var x = d3.scaleLinear()
//     .domain([1, 10])
//     .rangeRound([600, 860]);

// plot.selectAll("rect")
//   .data(stateColor.range().map(function(d) {
//       d = stateColor.invertExtent(d);
//       if (d[0] == null) d[0] = x.domain()[0];
//       if (d[1] == null) d[1] = x.domain()[1];
//       return d;
//     }))
//   .enter().append("rect")
//     .attr("height", 8)
//     .attr("x", function(d) { return x(d[0]); })
//     .attr("width", function(d) { return x(d[1]) - x(d[0]); })
//     .attr("fill", function(d) { return color(d[0]); });

// plot.append("text")
//     .attr("class", "caption")
//     .attr("x", x.range()[0])
//     .attr("y", -6)
//     .attr("fill", "#000")
//     .attr("text-anchor", "start")
//     .attr("font-weight", "bold")
//     .text("Unemployment rate");

/*
 *	Draw Tooltips
 */ 



/*
 * draw the continental united states
 */
function drawMap(error, map) {

	// Extract state names from https://gist.github.com/mbostock/4090846#file-us-state-names-tsv
	d3.tsv("data/us-state-names.tsv", function(statetsv){

		// Extract county names from https://gist.github.com/mbostock/4090846#file-us-county-names-tsv
		d3.csv("data/county-statecode.csv", function(countycsv){

			// Load county data
			d3.csv("data/data-county.csv",function(countyData){

				// Load state data
				d3.csv("data/data-state.csv",function(stateData){

					// Get county names
					var countyGetCodes = {};
					// extract just the names and Ids
					countycsv.forEach(function(d,i){
						countyGetCodes[d.id] = d.code;
					});



					// Place Holder to acces county name by state
					// To be used in "click" to get all counties associated
					// with clicked state.
					var getCountyNamesByState = {};

					// Get state code from id or get id from code
					var stateGetCodes = {};
					// Get state full name from state code
					var stateGetFullName = {};

					// extract just the names and Ids
					statetsv.forEach(function(d,i){
						stateGetCodes[d.id] = d.code;
						stateGetCodes[d.code] = d.id;
						stateGetFullName[d.code] = d.name;
						getCountyNamesByState[d.code] = [];
					});

					// Create List to get county price by county name
					var countyPrice = {};
					var countyToState = {};
					// extract just the names and Ids
					countyData.forEach(function(d,i){


						countyPrice[d.CountyName+","+d.State] = d.Price;
						countyToState[d.CountyName] = d.State;
						getCountyNamesByState[d.State].push(d.CountyName);

					});

					// Create List to get state price by state code
					var statePrice = {};
					// extract just the names and Ids
					stateData.forEach(function(d,i){
						statePrice[d.State] = d.Price;
					});

					// Get county name based on id
					var countyGetNames = {};
					// Safe version for ID, spaces replaced with underscore
					// d3.select will work better
					var countyGetSafeNames = {};
					// extract just the names and Ids
					countycsv.forEach(function(d,i){

						countyGetNames[d.id] = d.name;

						var str = d.name;
						str = str.replace(/\s+/g, '_')
						countyGetSafeNames[d.id] = str;
						countyGetSafeNames[d.name] = str;
					});

					// function getCountyNamesByState(stateCode) {

					// 	stateID = stateGetCodes[stateCode];




					// }




					// determines which ids belong to the continental united states
					// https://gist.github.com/mbostock/4090846#file-us-state-names-tsv
					var isContinental = function(d) {
						var id = +d.id;
						return id < 60 && id !== 2 && id !== 15;
					};

					/* TODO!! similar isContinental for counties */

					// filter out non-continental united states
					var old = map.objects.states.geometries.length;
					var unfilteredStates = map.objects.states.geometries;

					map.objects.states.geometries = map.objects.states.geometries.filter(isContinental);
					var filteredStates = map.objects.states.geometries;


					// Identify states that have been removed
					// var array1 = unfilteredStates;
					// var array2 = filteredStates;

					// for (var i=0; i<array2.length; i++) {
					//     index = array1.indexOf(array2[i]);
					//     if (index > -1) {
					//         array1.splice(index, 1);
					//     }
					// }

					// console.log(array1);


					// array1 now contains the IDs of only removed states


					// console.log("Filtered out " + (old - map.objects.states.geometries.length) + " states from base map.");

					// size projection to fit continental united states
					// https://github.com/topojson/topojson-client/blob/master/README.md#feature
					states = topojson.feature(map, map.objects.states);
					projection.fitSize([width, height], states);

					// Shift base to center

					// Set up base map and geo path generator
					var base = baseOuter;
					var path = d3.geoPath(projection);

					//First draw a "rect object" that is used for click & zoom
					// This is what allows zooming out when click in empty area
					// To zoom out only when click inside a particular state another method of
					// calling reset is needed.
					base.append("rect")
						.attr("class", "background")
						.attr("width", width)
						.attr("height", height)
						.on("click", reset);

					base.append("rect")
						.attr("class", "symbolbackground")
						.attr("width", width)
						.attr("height", height)
						.style("pointer-events","none")
						.on("click", symbolReset);

					// draw interior and exterior borders differently
					// https://github.com/topojson/topojson-client/blob/master/README.md#mesh

					// used to filter only interior borders
					var isInterior = function(a, b) { return a !== b; };

					// used to filter only exterior borders
					var isExterior = function(a, b) { return a === b; };

					// Draw State Areas
					var	stateLandBase = base.append("g")
							.attr("class", "states"); 

							// This is almost useless as the svg selection does not include the shapes drawn below

					var stateLand = stateLandBase.selectAll("path.states")
						.data(topojson.feature(map, map.objects.states).features)
						.enter().append("path")
							.attr("d", path)
							.attr("class",function(d){

								if (statePrice[stateGetCodes[d.id]] >= 0 ) {
									return "valid"
								}
								else {
									return ".undefined"
								}


							})						
							.attr("id",function(d){return stateGetCodes[d.id];})
							.style("fill", function(d) { return getStateColor(statePrice[stateGetCodes[d.id]]); })
							.on("click", clicked );
							// on "click" should be attached to each state area polygon
							// an overlapping rect object that's fully transparent is needed
							// for zooming out 
							//console.log(statePrice[stateGetCodes[d.id]]);

					// Draw State Borders
					base.append("path")
							.datum(topojson.mesh(map, map.objects.states, isInterior))
							.attr("class", "border interior")
							.attr("d", path);

					base.append("path")
							.datum(topojson.mesh(map, map.objects.states, isExterior))
							.attr("class", "border exterior")
							.attr("d", path);

					// Draw County Areas and Borders
					// This is for entire US view of each counties
					countyLandBase = base.append("g")
							.attr("class", "counties");

					countyLand = countyLandBase.selectAll("path")
						.data(topojson.feature(map, map.objects.counties).features)
						.enter().append("path")
							.attr("class",function(d){

								if (countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]] >= 0 ) {
									return "valid statecode-"+countyGetCodes[d.id]
								}
								else {
									return "undefined statecode-"+countyGetCodes[d.id]
								}


							})
							.attr("id",function(d){ return countyGetSafeNames[d.id] })
							.attr("fill", function(d) { return getcountyColor(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]); })
							.attr("d", path)
							.on("click", reset);
							//console.log(countyGetNames[d.id]+" "+countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]+ " "+ countyColor(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]) ); 


					// County border which is no longer works for some reason, so border is from county shape strokes
					// base.append("path")
					// 		.attr("class", "county-borders")
					// 		.attr("d", path(topojson.mesh(map, map.objects.counties, function(a, b) { return a !== b; })));


					// Draw Zoomed County Areas and Borders
					// This is for zoomed view of counties, the color scaled used is local not the same scale
					// for entire us counties.
					zoomCountyLandBase = base.append("g")
							.style("visibility","hidden")
							.attr("class", "zoom-counties");

					zoomCountyLand = zoomCountyLandBase.selectAll("path")
						.data(topojson.feature(map, map.objects.counties).features)
						.enter().append("path")
							.attr("class",function(d){

								if (countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]] >= 0 ) {
									return "validzoom zoomStatecode-"+countyGetCodes[d.id]
								}
								else {
									return "undefinedzoom zoomStatecode-"+countyGetCodes[d.id]
								}


							})
							.attr("id",function(d){ return "zoom"+countyGetSafeNames[d.id]+","+countyGetCodes[d.id] })
							.attr("d", path)
							.on("click", reset);
							//console.log(countyGetNames[d.id]+" "+countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]+ " "+ countyColor(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]) ); 

					// Hard coded states that have valid data
					var ValidStates = ["AK","AL","AR","AZ","CA","CO","CT","DC","DE","FL","GA","HI","IA","ID","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","NE","NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC","TN","TX","UT","VA","VT","WA","WI"];
					for (var i = 0; i < ValidStates.length; i++) {

						var localPriceArray = [];
						var selectionName = ".validzoom.zoomStatecode-"+ ValidStates[i]

						// Store prices in an array and convert to float to prevent problems with d3.max()
						d3.selectAll(selectionName)
							.each(function(d){
								localPriceArray.push(parseFloat(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]));
							});


						// var zoomCountyColor = d3.scaleSequential(d3.interpolatePurples)
						// 			.domain([0,d3.max(localPriceArray)]);

						var zoomCountyColor = d3.scaleLinear()
							.range([d3.rgb("#deebf7"),d3.rgb("#39b0ef")])
							.domain([0,d3.max(localPriceArray)])
							.interpolate(d3.interpolateHcl);

						d3.selectAll(selectionName)
							// .attr("fill",function(d){ console.log(countyGetNames[d.id]+","+countyGetCodes[d.id]) ;console.log(zoomCountyColor(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]])); return zoomCountyColor(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]])})
							.attr("fill",function(d){ return zoomCountyColor(countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]])})

					}


					/* Symbol Map  */

					d3.csv("data/data-city.csv", function(citycsv){

						var cityGetSafeName = []
						citycsv.forEach(function(d,i){

						var str = d.City;
						str = str.replace(/\s+/g, '_')

						cityGetSafeName[d.City] = str;

						});




						var radius = d3.scaleSqrt()
							.domain([0, 1e6])
							.range([0, 150]);

						var symbolMapBase = base.append("g")
													.attr("class","symbolMap");

					// Draw new overlapping map				

						var symbolLand = symbolMapBase.selectAll("path.states")
							.data(topojson.feature(map, map.objects.states).features)
							.enter().append("path")
								.attr("d", path)
								.attr("class","symbolMap")						
								.attr("id",function(d){return stateGetCodes[d.id];})
								.style("fill", "#eaeaea")
								.style("visibility","hidden")
								.on("click", symbolClicked );

						// Draw State Borders
						symbolMapBase.append("path")
								.datum(topojson.mesh(map, map.objects.states, isInterior))
								.attr("class", "border interior symbolMap")
								.attr("d", path);

						symbolMapBase.append("path")
								.datum(topojson.mesh(map, map.objects.states, isExterior))
								.attr("class", "border exterior symbolMap")
								.attr("d", path);							

						symbolMapBase.append("g")
							  .attr("class", "bubble")
							.selectAll("circle")
							  .data(citycsv.sort(function(a, b) { return b.Price - a.Price; }))
							.enter().append("circle")
								.attr("class","circle ")
								.attr("id",function(d){ return "circle_"+cityGetSafeName[d.City]})
								.attr("transform", function(d) {return "translate(" + projection([d.lon,d.lat]) + ")";})
								.attr("r", function(d) { return radius(d.Price); })
								.attr("fill","teal")
								.attr("fill-opacity","0.3")
								.attr("stroke","#fff")
								.attr("visibility","hidden")
							.append("title")
								.text(function(d) {
									return d.City + "\nAverage Price: " + d.Price;
								});



					
					});

					/*
					 *	Draw Tooltips
					 */

					 //  NOTE TO SELF!!! THERE IS A GIANT TRANSPARENT RECTANGLE COVERING THE
					 // ENTIRE PLOT, IT'S PURPOSE IS TO ALLOW ZOOM OUT WHEN CLICK WHITE AREA OR
					 //  NON ACTIVE AREA

					 // Check http://stackoverflow.com/questions/37892835/d3-keeping-text-from-extending-outside-of-svg/37892927
					 // Method to change text anchor when text out of bounds.
					
					// Where you append tooltipSVG is important, if append to baseOuter which is used by
					// the zoom function, your tooltip will expand when zoomed				 
					// var tooltipSVG = baseMapSVG.append("g").attr("id", "tooltip"); 
					// var tooltip = tooltipSVG.append("text").attr("id", "tooltip");

					var tooltip = d3.select("body").append("div").attr("class", "toolTip");

					// tooltip.attr("text-anchor", "end");
					// tooltip.attr("dx", -5);
					// tooltip.attr("dy", -5);
					// tooltip.style("visibility", "hidden");

					/*
					 * Add interactivity for svg path of map shapes
					 */ 

					// add interactivity for states lands
					stateLand.on("mouseover", function(d) {
							if ( d3.select(this).classed("valid")  ) {
								// tooltip.text(stateGetCodes[d.id]+", "+"Median Rent: $"+statePrice[stateGetCodes[d.id]]);
								// console.log(stateGetCodes[d.id]+", "+"Median Rent: $"+statePrice[stateGetCodes[d.id]]);
								// tooltip.style("fill","black");							
								tooltip.style("visibility", "visible");

								// Make darker on hover
								d3.select(this)
									.style("stroke","black")
									.style("stroke-width",3)
									.style("fill",d3.rgb(d3.select(this).style("fill")).darker(0.5));

								d3.select("#bar_"+d3.select(this).attr("id"))
									.style("stroke","black")
									.style("stroke-width",3);
									// .style("fill",d3.rgb(d3.select(this).style("fill")).darker(0.5));

							}

							
						})
						.on("mousemove", function(d) {
							var coords = d3.mouse(base.node());
							// tooltip.style("fill","black");
							// tooltip.attr("x", coords[0]);
							// tooltip.attr("y", coords[1]);

							bbox = d3.select(this).node().getBBox();


							tooltip.style("left", bbox.x + bbox.width/2 + "px")
							  .style("top", bbox.y + bbox.height/2 - 30 + "px")
							  .style("display", "inline-block")
							  .style("pointer-events","none")
							  .html( stateGetFullName[stateGetCodes[d.id]] + "<br>" + "Median Rent:" + "<br>" + "$" + (statePrice[stateGetCodes[d.id]]));

							// d3.select(this).each(function(data){ 




							// tooltip.style("left", path.centroid(data)[0]  + "px")
							//   .style("top", path.centroid(data)[1] + 50 + "px")
							//   .style("display", "inline-block")
							//   .style("pointer-events","none")
							//   .html((stateGetFullName[stateGetCodes[d.id]]) + "<br>" + "Median Rent:" + "<br>" + "$" + (statePrice[stateGetCodes[d.id]]));

							//  });


							d3.select(this).style("cursor", "pointer"); 

							// tooltip.attr("text-anchor", function () {
							// 	 // var position = d3.mouse();  // position[0] <= x    position[1]  <= y
							// 	 // if (position[0] < (svg_width/2) ) {
							// 	 if (coords[0] < 300 ) {
							// 			// you are on A zone
							// 			return "start";
							// 	 } else {
							// 			// you are on B zone
							// 			return "end";
							// 	 }
							// })							
						})
						.on("mouseout", function(d) {
							tooltip.style("visibility", "hidden");
							d3.select(this).style("cursor", "default"); 

							// Make brighter on mouse out
							if ( d3.select(this).classed("valid")  ) {
								d3.select(this)
									.style("stroke","none")									
									.style("fill",d3.rgb(d3.select(this).style("fill")).brighter(0.5));
								d3.select("#bar_"+d3.select(this).attr("id"))
									.style("stroke","none");
									// .style("fill",d3.rgb(d3.select(this).style("fill")).brighter(0.5));
							}
						});


					var tooltipSVG = baseMapSVG.append("g").attr("id", "tooltip"); 
					var countytooltip = tooltipSVG.append("text").attr("id", "tooltip");

					countytooltip.attr("text-anchor", "end");
					countytooltip.attr("dx", -5);
					countytooltip.attr("dy", -5);
					countytooltip.style("visibility", "hidden");
					// add interactivity for entire view counties
					countyLand.on("mouseover", function(d) {
							if ( d3.select(this).classed("valid")  ) {

								countytooltip.text(countyGetNames[d.id]+", "+"Median Rent: $"+countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]);
								// console.log(stateGetCodes[d.id]+", "+"Median Rent: $"+statePrice[stateGetCodes[d.id]]);
								countytooltip.style("visibility", "visible")
								// tooltip.style("stroke-width","1.5px")
								// tooltip.style("stroke","blue");
							}
						})
						.on("mousemove", function(d) {
							var coords = d3.mouse(base.node());
							countytooltip.attr("x", coords[0]); // add 200
							countytooltip.attr("y", coords[1]);
							countytooltip.style("fill","black");



						})
						.on("mouseout", function(d) {
							countytooltip.style("visibility", "hidden");

						});


					// add interactivity for zoomede view counties
					zoomCountyLand.on("mouseover", function(d) {
								// Weird.. I am hovering over zoomCountyLand path object but upon inspecting class list it only has
								// valid class which belongs to countyLand path instead of validzoom class

							if ( d3.select(this).classed("validzoom")  ) {

								// tooltip.text(countyGetNames[d.id]+", "+"Median Rent: $"+countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]);
								// console.log(stateGetCodes[d.id]+", "+"Median Rent: $"+statePrice[stateGetCodes[d.id]]);
								tooltip.style("visibility", "visible")
								// tooltip.style("stroke-width","1.5px")
								// tooltip.style("stroke","blue");

							bbox = d3.select(this).node().getBBox();
							d3.select(this).each(function(data){ 

							tooltip.style("left", path.centroid(data)[0]  + "px")
							  .style("top", path.centroid(data)[1] + "px")
							  .style("display", "inline-block")
							  .style("pointer-events","none")
							  .html( countyGetNames[d.id] + "<br>" + "Median Rent:" + "<br>" + "$" + countyPrice[countyGetNames[d.id]+","+countyGetCodes[d.id]]);


							});


							}

						})
						.on("mousemove", function(d) {
							var coords = d3.mouse(base.node());
							// tooltip.attr("x", coords[0]); // add 200
							// tooltip.attr("y", coords[1]);
							// tooltip.style("fill","black");
							d3.selectAll(".validzoom").style("cursor", "default"); 



						})
						.on("mouseout", function(d) {
							tooltip.style("visibility", "hidden");
							d3.selectAll(".undefinedzoom").style("cursor", "not-allowed"); 

						});



						/*
						 * Zoom Related Functions
						 */
						 d3.select("#CA").on("click",clicked);


						// clicked() and reset() function for click on zoom feature
						function clicked(passedInObject) {

							// normally click is called with .on("click",clicked)
							// where this is an object referencing the clicked svg path
							// due to needing to zoom by clicking bar, alternative method needed.

							stateCode = stateGetCodes[passedInObject.id];
							thisObject = d3.select("#"+stateCode ).node();
							// the code chunk below replaces the "d" from before
							
							var data ={};
							d3.select("#"+stateCode).each(function(d){data=d});

							if (active.node() === thisObject) return reset();
							active.classed("active", false); // is this to reset previous active?
							// Active is the selected state area shape path object being zoomed upon.
							active = d3.select(thisObject).classed("active", true);
							
							// Decrease opacity so that the .undefined counties that are also
							// transparent wont look weird.
							active.style("opacity",0.1);

							// console.log("statecode-"+active.attr("id"));

							var bounds = path.bounds(data),
									dx = bounds[1][0] - bounds[0][0],
									dy = bounds[1][1] - bounds[0][1],
									x = (bounds[0][0] + bounds[1][0]) / 2,
									y = (bounds[0][1] + bounds[1][1]) / 2,
									scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
									translate = [width / 2 - scale * x, height / 2 - scale * y];

							baseOuter.transition()
									.duration(750)
									.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4

							// make borders appear when zoom in
							d3.selectAll(".zoomStatecode-"+active.attr("id"))
									.style("visibility","visible");

							// Below is to draw bar chart of zoomed counties
							// But first create a data array of zoomed counties to be
							// passed into draw bar chart function
							var clickedStateCode = d3.select(thisObject).attr("id");
							var clickedCountyArray = getCountyNamesByState[clickedStateCode];

							var chartData = []
							clickedCountyArray.forEach(function(d,i) {
								
								countyName = d;
								d = {};

								d["CountyName"] = countyName;
								d["State"] = countyToState[countyName];
								d["Price"] = countyPrice[countyName+","+countyToState[countyName]]

								chartData.push(d);

							});

							// Remove previous bar chart when click
							// This part is a bit useless because if someone clicks 2 states in a
							// row it breaks the visualization, at least now it breaks a bit nicer....
							d3.select("#zoomCountyBarChart").remove();


							// When zoom in hide state bar chart and add zoom county bar chart
							d3.select("#stateBarChart")
								.style("visibility","hidden");

								
							drawZoomCountyBarCharts(barChartSVG,chartData);

						}




						// Part of C&Z function 
						function reset() {

							// Make borders disappear when zoom out
							d3.selectAll(".zoomStatecode-"+active.attr("id"))
								.style("visibility","hidden");

							// when zoom out replace zoom county bar chart with state bar chart
							d3.select("#zoomCountyBarChart").remove();


							d3.select("#stateBarChart")
								.style("visibility","visible");


						  // baseOuter.attr("transform","translate(200,0)");
							
							// Need to reverse the opacity
							active.style("opacity",1);

							// reset active to false
							active.classed("active", false);
							active = d3.select(null);

							baseOuter.transition()
									.duration(750)
									// .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
									.call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
						}

						function symbolClicked(passedInObject) {

							// normally click is called with .on("click",clicked)
							// where this is an object referencing the clicked svg path
							// due to needing to zoom by clicking bar, alternative method needed.

							stateCode = stateGetCodes[passedInObject.id];
							thisObject = d3.select("#"+stateCode ).node();
							// the code chunk below replaces the "d" from before
							
							var data ={};
							d3.select("#"+stateCode).each(function(d){data=d});

							if (active.node() === thisObject) return symbolReset();
							active.classed("active", false); // is this to reset previous active?
							// Active is the selected state area shape path object being zoomed upon.
							active = d3.select(thisObject).classed("active", true);
							
							// Decrease opacity so that the .undefined counties that are also
							// transparent wont look weird.
							active.style("opacity",0.1);

							// console.log("statecode-"+active.attr("id"));

							var bounds = path.bounds(data),
									dx = bounds[1][0] - bounds[0][0],
									dy = bounds[1][1] - bounds[0][1],
									x = (bounds[0][0] + bounds[1][0]) / 2,
									y = (bounds[0][1] + bounds[1][1]) / 2,
									scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
									translate = [width / 2 - scale * x, height / 2 - scale * y];

							baseOuter.transition()
									.duration(750)
									.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4


							// Below is to draw bar chart of zoomed counties
							// But first create a data array of zoomed counties to be
							// passed into draw bar chart function
							var clickedStateCode = d3.select(thisObject).attr("id");
							var clickedCountyArray = getCountyNamesByState[clickedStateCode];

							var chartData = []
							clickedCountyArray.forEach(function(d,i) {
								
								countyName = d;
								d = {};

								d["CountyName"] = countyName;
								d["State"] = countyToState[countyName];
								d["Price"] = countyPrice[countyName+","+countyToState[countyName]]

								chartData.push(d);

							});


						}

						// Part of C&Z function 
						function symbolReset() {


							// Need to reverse the opacity
							active.style("opacity",1);

							// reset active to false
							active.classed("active", false);
							active = d3.select(null);

							baseOuter.transition()
									.duration(750)
									// .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
									.call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
						}



						drawStateBarCharts(barChartSVG,"data/data-state.csv")
						drawCountyBarCharts(barChartSVG,"data/data-county.csv")
						drawCityBarCharts(barChartSVG,"data/data-city.csv")

						/*
						 *	Bar Chart Related Functions
						 */

						function drawStateBarCharts(barChartSVG,csvPath) {

							// Changing margin here will change margin for all bar charts
							// for some reason only translate used here is effective
							var svg = barChartSVG,
								margin = {top: 60, right: 20, bottom: 30, left: 80};
							
							var width  = +svg.attr("width")- margin.left - margin.right;
							var height = +svg.attr("height")- margin.top - margin.bottom;

							svg.attr("transform","translate(0,0)");

							var y = d3.scaleBand().rangeRound([0, height]).padding(0.1),
								x = d3.scaleLinear().rangeRound([0,width]);

							var chartBase = svg.append("g")
								.attr("id","chartBase")
								.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

							var g = chartBase.append("g")
									.attr("id","stateBarChart");

							d3.csv(csvPath, 
								// function(d) {
								// 	  d.Price = +d.Price;
								// 	  return d;
								// }, 
							function(error, data) {
							  if (error) throw error;



							// for (var i=0; i<array2.length; i++) {
							//     index = array1.indexOf(array2[i]);
							//     if (index > -1) {
							//         array1.splice(index, 1);
							//     }
							// }

							// Keep only top 10 states
							data = data.slice(0,10);


							  y.domain(data.map(function(d) { return d.Name; }));
							  x.domain([0, 4104]); // Warning, hard-coded!

							  g.append("g")
								  .attr("class", "axis axis--x")
								  .attr("transform", "translate(0," + height + ")")
								  .call(d3.axisBottom(x));

							  g.append("g")
								  .attr("class", "axis axis--y")
								  .call(d3.axisLeft(y).ticks(10))
								.append("text")
								  .attr("transform", "rotate(-90)")
								  .attr("y", 6)
								  .attr("dy", "0.71em")
								  .attr("text-anchor", "end")
								  .text("Price");

							  g.selectAll(".bar")
								.data(data)
								.enter().append("rect")
								  .attr("class", "bar")
								  .attr("id",function(d){return "bar_"+d.State;})
								  .attr("y", function(d) { return y(d.Name); })
								  .attr("x", function(d) { return 5; })
								  .attr("fill",function(d){ return getStateColor(d.Price)})
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); })
								  .on("mouseover",function(d){

									console.log(d3.select(this));
									d3.select(this)
										.style("stroke","black")
										.style("stroke-width",3)
										.style("fill",d3.rgb(d3.select(this).style("fill")).darker(0.5));		  	
								  });

							  // add the X gridlines
							  g.append("g")			
								  .attr("class", "grid")
								  .attr("transform", "translate(0," + height + ")")
								  .call(make_x_gridlines()
									  .tickSize(-height)
									  .tickFormat("")
									  );

								g.selectAll(".float_bar")
								  .data(data)
								  .enter().append("rect")
								  .attr("y", function(d) { return y(d.Name); })
								  .attr("x", function(d) { return 5; })
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); })
								  .style("opacity",0)
								  .style("cursor","pointer")
								  
								  .on("mouseover",function(d){
									d3.select("#bar_"+d.State)
										.style("stroke","black")
										.style("stroke-width",3)
										.style("fill",d3.rgb(d3.select("#bar_"+d.State).style("fill")).darker(0.5));


									d3.select("#"+d.State)
										.style("stroke","black")
										.style("stroke-width",3)
										.style("fill",d3.rgb(d3.select("#bar_"+d.State).style("fill")).darker(0.5));		  	
								  })
								  .on("mouseout",function(d){
									d3.select("#bar_"+d.State)
										.style("stroke","none")
										.style("fill",d3.rgb(d3.select("#bar_"+d.State).style("fill")).brighter(0.5));		  	

									d3.select("#"+d.State)
										.style("stroke","none")
										.style("fill",d3.rgb(d3.select("#bar_"+d.State).style("fill")).brighter(0.5));	
								  })
								  .on("click",clicked)
								  .append("title")
										.text(function(d) {
											return d.Name + "\nAverage Price: " + d.Price;
										});


								// gridlines in x axis function
								function make_x_gridlines() {		
									return d3.axisBottom(x)
										.ticks(3);
								}


								});

						}



						function drawCountyBarCharts(barChartSVG,csvPath) {

							// remember that margin left doesn't work here, only in draw state bar
							var margin = {top: 60, right: 40, bottom: 30, left: 40};
							
							var width  = +barChartSVG.attr("width")- margin.left - margin.right;
							var height = +barChartSVG.attr("height")- margin.top - margin.bottom;

							// svg.attr("transform","translate(0,0)");

							var y = d3.scaleBand().rangeRound([0, height]).padding(0.1),
								x = d3.scaleLinear().rangeRound([0,width]);

							var g = d3.select("#chartBase").append("g")
										.attr("id","countyBarChart")
										.style("visibility","hidden");

							d3.csv(csvPath, 
								// function(d) {
								// 	  d.Price = +d.Price;
								// 	  return d;
								// }, 
							function(error, data) {
							  if (error) throw error;

							// Keep only top 10 states
							data = data.slice(0,10);

							  y.domain(data.map(function(d) { return d.CountyName; }));
							  x.domain([0, 33376.08]); // Warning, hard-coded!

							  g.append("g")
								  .attr("class", "axis axis--x")
								  .attr("transform", "translate(0," + height + ")")
								  .call(d3.axisBottom(x));

							  g.append("g")
								  .attr("class", "axis axis--y")
								  .call(d3.axisLeft(y).ticks(10))
								.append("text")
								  .attr("transform", "rotate(-90)")
								  .attr("y", 6)
								  .attr("dy", "0.71em")
								  .attr("text-anchor", "end")
								  .text("Price");

							  g.selectAll(".bar")
								.data(data)
								.enter().append("rect")
								  .attr("class", "bar")
								  .attr("y", function(d) { return y(d.CountyName); })
								  .attr("x", function(d) { return 5; })
								  .attr("fill",function(d){ return getCountyColor(d.Price)})
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); });




							  // add the X gridlines
							  g.append("g")			
								  .attr("class", "grid")
								  .attr("transform", "translate(0," + height + ")")
								  .call(make_x_gridlines()
									  .tickSize(-height)
									  .tickFormat("")
									  );

								// gridlines in x axis function
								function make_x_gridlines() {		
									return d3.axisBottom(x)
										.ticks(3);
								}


								g.selectAll(".float_bar")
								  .data(data)
								  .enter().append("rect")
								  .attr("y", function(d) { return y(d.CountyName); })
								  .attr("x", function(d) { return 5; })
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); })
								  .style("opacity",0)
								  .style("cursor","pointer")
								  .append("title")
										.text(function(d) {
											return d.CountyName + "\nAverage Price: " + d.Price;
										});




								});

								

						}


						function drawZoomCountyBarCharts(barChartSVG,data) {
							// remember that margin left doesn't work here, only in draw state bar
							// for some reason right margin works
							var margin = {top: 60, right: 50, bottom: 30, left: 40};
							
							var width  = +barChartSVG.attr("width")- margin.left - margin.right;
							var height = +barChartSVG.attr("height")- margin.top - margin.bottom;

							// svg.attr("transform","translate(0,0)");

							var y = d3.scaleBand().rangeRound([0, height]).padding(0.1),
								x = d3.scaleLinear().rangeRound([0,width]);

							var g = d3.select("#chartBase").append("g")
										.attr("id","zoomCountyBarChart")
										.style("visibility","visible");

							data.sort(function(x, y){
								return d3.descending(parseFloat(x.Price), parseFloat(y.Price));
							});


							drawBarChart(data);


							function drawBarChart(data) {

							// // Keep only top 10 states
							// data = data.slice(0,10);

							  y.domain(data.map(function(d) { return d.CountyName; }));
							  x.domain([0, d3.max(data, function(d){return parseFloat(d.Price)})]); 


							  var zoomColor = d3.scaleLinear()
								  .range([d3.rgb("#deebf7"),d3.rgb("#39b0ef")])
								  .domain([0,d3.max(data, function(d){return parseFloat(d.Price)})])
								  .interpolate(d3.interpolateHcl);

							  g.append("g")
								  .attr("class", "axis axis--x")
								  .attr("transform", "translate(0," + height + ")")
								  .call(d3.axisBottom(x).ticks(4));

							  g.append("g")
								  .attr("class", "axis axis--y")
								  .call(d3.axisLeft(y).ticks(10))
								.append("text")
								  .attr("transform", "rotate(-90)")
								  .attr("y", 6)
								  .attr("dy", "0.71em")
								  .attr("text-anchor", "end")
								  .text("Price");

							  g.selectAll(".bar")
								.data(data)
								.enter().append("rect")
								  .attr("class", "bar")
								  // .attr("id",function(d){ return countyGetSafeNames[d.CountyName]; })		  
								  .attr("y", function(d) { return y(d.CountyName); })
								  .attr("x", function(d) { return 5; })
								  .attr("fill",function(d){ return zoomColor(d.Price)})
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); });

							  // add the X gridlines
							  g.append("g")			
								  .attr("class", "grid")
								  .attr("transform", "translate(0," + height + ")")
								  .call(make_x_gridlines()
									  .tickSize(-height)
									  .tickFormat("")
									  );

								function make_x_gridlines() {		
									return d3.axisBottom(x)
										.ticks(3);
								}


								g.selectAll(".float_bar")
								  .data(data)
								  .enter().append("rect")
								  .attr("y", function(d) { return y(d.CountyName); })
								  .attr("x", function(d) { return 5; })
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); })
								  .style("opacity",0)
								  .style("cursor","pointer")
								  .on("click",reset)
								  .append("title")
										.text(function(d) {
											return d.CountyName + "\nAverage Price: " + d.Price;
										});;



							}

						}




						function drawCityBarCharts(barChartSVG,csvPath) {

							// remember that margin left doesn't work here, only in draw state bar
							var margin = {top: 60, right: 40, bottom: 30, left: 40};
							
							var width  = +barChartSVG.attr("width")- margin.left - margin.right;
							var height = +barChartSVG.attr("height")- margin.top - margin.bottom;

							// svg.attr("transform","translate(0,0)");

							var y = d3.scaleBand().rangeRound([0, height]).padding(0.1),
								x = d3.scaleLinear().rangeRound([0,width]);

							var g = d3.select("#chartBase").append("g")
										.attr("id","cityBarChart")
										.style("visibility","hidden");

							d3.csv(csvPath, 
								// function(d) {
								// 	  d.Price = +d.Price;
								// 	  return d;
								// }, 
							function(error, data) {
							  if (error) throw error;

							// Keep only top 10 states
							data = data.slice(0,10);

							var barCitySafeName = [];
							data.forEach(function(d){

								var str = d.City;
								str = str.replace(/\s+/g, '_')

								barCitySafeName[d.City] = str;



							});

							  y.domain(data.map(function(d) { return d.City; }));
							  x.domain([0, 33376.08]); // Warning, hard-coded!

							  g.append("g")
								  .attr("class", "axis axis--x")
								  .attr("transform", "translate(0," + height + ")")
								  .call(d3.axisBottom(x));

							  g.append("g")
								  .attr("class", "axis axis--y")
								  .call(d3.axisLeft(y).ticks(10))
								.append("text")
								  .attr("transform", "rotate(-90)")
								  .attr("y", 6)
								  .attr("dy", "0.71em")
								  .attr("text-anchor", "end")
								  .text("Price");

							  g.selectAll(".bar")
								.data(data)
								.enter().append("rect")
								  .attr("class", "bar")
								  .attr("y", function(d) { return y(d.City); })
								  .attr("x", function(d) { return 5; })
								  .attr("fill", "teal")
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); })
								  .append("title")
								.text(function(d) {
									return d.City + "\nAverage Price: " + d.Price;
								});



							  // add the X gridlines
							  g.append("g")			
								  .attr("class", "grid")
								  .attr("transform", "translate(0," + height + ")")
								  .call(make_x_gridlines()
									  .tickSize(-height)
									  .tickFormat("")
									  );

								// gridlines in x axis function
								function make_x_gridlines() {		
									return d3.axisBottom(x)
										.ticks(3);
								}


							  g.selectAll(".hoverbar")
								.data(data)
								.enter().append("rect")
								  .attr("class", "hoverbar")
								  .attr("y", function(d) { return y(d.City); })
								  .attr("x", function(d) { return 5; })
								  .attr("fill", "teal")
								  .attr("opacity",0)
								  .attr("id",function(d){ return barCitySafeName[d.City]})
								  .attr("height", y.bandwidth())
								  .attr("width", function(d) { return  x(d.Price); })
								  .on("mouseover",function(d){



									d3.select("#circle_"+barCitySafeName[d.City])
										.attr("fill-opacity","0.7")
										.style("fill","red").raise();


								  })
								  .on("mouseout",function(d){
									d3.select("#circle_"+barCitySafeName[d.City])
										.attr("fill-opacity","0.3")
										.style("fill","teal");


								  })
								  .append("title")
								.text(function(d) {
									return d.City + "\nAverage Price: " + d.Price;
								});




							});

						}


//  ENNDDDD of function

				}); // End of d3.csv for state data

			}); // End of d3.csv for county data

		}); // End of d3.csv for county names

	}); // End of d3.tsv for state names

}// End of drawMap function.


// Part of Click to Zoom function
function zoomed() {
	baseOuter.style("stroke-width", 1.5 / d3.event.transform.k + "px");
	// g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
	baseOuter.attr("transform", d3.event.transform); // updated for d3 v4
}



/*
 * Color scale related function
 */

function getcountyColor(inputData) {

	if ( countyColor(inputData) != d3.rgb(0,0,0) ) {
		return countyColor(inputData);
	} 
	else {
		return "#eaeaea"
	}

}

function getZoomCountyColor(inputData) {

	if ( countyColor(inputData) != d3.rgb(0,0,0) ) {
		return countyColor(inputData);
	} 
	else {
		return "#eaeaea"
	}

}

function getStateColor(inputData) {

	if ( stateColor(inputData) != d3.rgb(0,0,0) ) {
		return stateColor(inputData);
	} 
	else {
		return "#eaeaea"
	}

}

function getCountyColor(inputData) {

	if ( countyColor(inputData) != d3.rgb(0,0,0) ) {
		return countyColor(inputData);
	} 
	else {
		return "#eaeaea"
	}

}

/*
 *	Button Related Functions
 */

function toggleMapButton(plot) {
			// Credits to Nikhil Nathwani
			// http://bl.ocks.org/nikhilNathwani/5dca6c63a53934185d05

			//container for all buttons
			var allButtons= plot.append("g")
								.attr("id","allButtons")
								.attr("transform","translate(80,0)");

			//fontawesome button labels
			var labels= ['State','County','City']; 

			//colors for different button states 
			var defaultColor= "#999faa"
			var hoverColor= "#4d576b"
			var pressedColor= "#000f2b"

			// var defaultColor= "#7777BB"
			// var hoverColor= "#0000ff"
			// var pressedColor= "#000077"


			//groups for each button (which will hold a rect and text)
			var buttonGroups= allButtons.selectAll("g.button")
									.data(labels)
									.enter()
									.append("g")
									.attr("class","button")
									.style("cursor","pointer")
									.on("click",function(d,i) {
										updateButtonColors(d3.select(this), d3.select(this.parentNode));
										
										// Depending on button, make county data visible
										d3.select("#plot").selectAll(".counties")
												.style("visibility",visibilityStatus(i));
										d3.select("#countyBarChart").style("visibility",visibilityStatus(i));

										d3.selectAll(".background").style("pointer-events",backgroundPointerStatus(i))

										d3.selectAll(".background").style("visibility",backgroundVisibilityStatus(i))

										// If county bar chart visible then hide state bar chart.
										d3.select("#stateBarChart").style("visibility",visibilityStatus(i+1));

										d3.selectAll(".states").style("opacity",opacityStatus(i));
						





										d3.selectAll(".circle").style("visibility",symbolVisibilityStatus(i));

										d3.selectAll(".symbolMap").style("visibility",symbolVisibilityStatus(i));	

										d3.select("#cityBarChart").style("visibility",symbolVisibilityStatus(i));

										d3.selectAll(".symbolbackground").style("pointer-events",symbolbackgroundPointerStatus(i));


									})
									.on("mouseover", function() {
										if (d3.select(this).select("rect").attr("fill") != pressedColor) {
											d3.select(this)
												.select("rect")
												.attr("fill",hoverColor);
										}
									})
									.on("mouseout", function() {
										if (d3.select(this).select("rect").attr("fill") != pressedColor) {
											d3.select(this)
												.select("rect")
												.attr("fill",defaultColor);
										}
									})
			function backgroundPointerStatus(buttonIndex) {
				if (buttonIndex === 0) {
					return "all";
				}
				else if (buttonIndex === 1) {
					return "all";
				}
				else if (buttonIndex === 2) { // this case is for hiding state bar chart
					return "none"
				}

			}

			function backgroundVisibilityStatus(buttonIndex) {
				if (buttonIndex === 0) {
					return "visible";
				}
				else if (buttonIndex === 1) {
					return "visible";
				}
				else if (buttonIndex === 2) { // this case is for hiding state bar chart
					return "hidden"
				}

			}

			function symbolbackgroundPointerStatus(buttonIndex) {
				if (buttonIndex === 0) {
					return "none";
				}
				else if (buttonIndex === 1) {
					return "none";
				}
				else if (buttonIndex === 2) { // this case is for hiding state bar chart
					return "all"
				}

			}

			function symbolVisibilityStatus(buttonIndex) {
				if (buttonIndex === 0) {
					return "hidden";
				}
				else if (buttonIndex === 1) {
					return "hidden";
				}
				else if (buttonIndex === 2) { // this case is for hiding state bar chart
					return "visible"
				}

			}
			function visibilityStatus(buttonIndex) {
				if (buttonIndex === 0) {
					return "hidden";
				}
				else if (buttonIndex === 1) {
					return "visible";
				}
				else if (buttonIndex === 2) { // this case is for hiding state bar chart
					return "hidden"
				}
				else if (buttonIndex === 3) { // this case is for hiding state bar chart
					return "hidden"
				}

			}

			function opacityStatus(buttonIndex) {
				if (buttonIndex === 0) {
					return 1;
				}
				else if (buttonIndex === 1) {
					return 0.2;
				}
				else if (buttonIndex === 2) { // this case is for hiding state bar chart
					return 1;
				}

			}

			var bWidth= 65; //button width
			var bHeight= 35; //button height
			var bSpace= 2; //space between buttons
			var x0= 20; //x offset
			var y0= 10; //y offset

			//adding a rect to each toggle button group
			//rx and ry give the rect rounded corner
			buttonGroups.append("rect")
						.attr("class","buttonRect")
						.attr("id",function(d,i){return "button"+(i+1)}) // index start from 1
						.attr("width",bWidth)
						.attr("height",bHeight)
						.attr("stroke","black")
						.attr("stroke-width",2)
						.attr("x",function(d,i) {return x0+(bWidth+bSpace)*i;})
						.attr("y",y0)
						// .attr("rx",5) //rx and ry give the buttons rounded corners
						// .attr("ry",5)
						.attr("fill",defaultColor)

			// Default pressed button is state button, no need to deal with javascript
			// just assume upon loading settings are correct
			d3.select("#button1")
				.attr("fill",pressedColor);

			//adding text to each toggle button group, centered 
			//within the toggle button rect
			buttonGroups.append("text")
						.attr("class","buttonText")
						// .attr("font-family","FontAwesome")
						.attr("x",function(d,i) {
							return x0 + (bWidth+bSpace)*i + bWidth/2;
						})
						.attr("y",y0+bHeight/2)
						.attr("text-anchor","middle")
						.attr("dominant-baseline","central")
						.attr("fill","white")
						.text(function(d) {return d;})

			function updateButtonColors(button, parent) {
				parent.selectAll("rect")
						.attr("fill",defaultColor)

				button.select("rect")
						.attr("fill",pressedColor)
			}

}
