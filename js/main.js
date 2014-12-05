//global vars
var dataset, data, projection, isZoomed = true, totalCasualties = 0;

//IE fixes and iframe init
var makeUnselectable = function($target) {
	$target.addClass('unselectable') // All these attributes are inheritable
		.attr('unselectable', 'on') // For IE9 - This property is not inherited, needs to be placed onto everything
		.attr('draggable', 'false') // For moz and webkit, although Firefox 16 ignores this when -moz-user-select: none; is set, it's like these properties are mutually exclusive, seems to be a bug.
		.on('dragstart', function() {
			return false;
		}); // Needed since Firefox 16 seems to ingore the 'draggable' attribute we just applied above when '-moz-user-select: none' is applied to the CSS 
	$target // Apply non-inheritable properties to the child elements
		.find('*').attr('draggable', 'false').attr('unselectable', 'on');
};
var links = document.querySelectorAll('a');
for (var i = 0; i < links.length; i++) {
	links[i].addEventListener('click', function(event) {
		event.preventDefault();
		iframeMessenger.navigate(this.href);
	}, false);
}
iframeMessenger.enableAutoResize();
//
var winW, isMobile;
// from http://www.scienzagiovane.unibo.it/English/tsunami/5-tsunami-2004.html
var tsunamiLat = 3.19;
var tsunamiLon = 96;
$(window).resize(function() {
	winW = $(window).width();
	checkWin();
});
$(function() {
	initData();
	winW = $(window).width();
	checkWin();
	if (!Array.indexOf) { // IE fix
		Array.prototype.indexOf = function(obj) {
			for (var i = 0; i < this.length; i++) {
				if (this[i] === obj) {
					return i;
				}
			}
			return -1;
		}
	}
});

function checkWin() {
	winW > 739 ? isMobile = false : isMobile = true;
}

function initData() {
	"use strict";
	var key = "1KnOjqvRKyLMF73Uky58tQFcg4zOVk2YrRzaZjx1no3o";
	//var key = window.location.search.slice(1);		
	var url = "http://interactive.guim.co.uk/spreadsheetdata/" + key + ".json";
	$.getJSON(url, handleResponse);
};

function handleResponse(data) {
	dataset = data.sheets.countryData;
	buildView();
	setTotalCasualties();

	function setTotalCasualties() {
		_.each(dataset, function(item) {
			if (!isNaN(item.casualties)) {
				totalCasualties = totalCasualties + item.casualties;
			}
		})
	}
	console.log(totalCasualties)
}

function buildView() {
	checkWin();
	populateDropDown();
	drawMap();
	renderSlider();
	var limtedResize = _.debounce(render, 200);
	$(window).resize(_.bind(limtedResize, this));
}

function addListeners() {
		$("#filter-dropdown").change(function(e) {
			upDateFromSelectFilters(e);
		})
	}
	//responsiveness

function render() {
		drawMap();
	}
	// dropdown

function populateDropDown() {
	var firstEntry = true;
	var htmlStr = "";
	_.each(dataset, function(item) {
		var formatCountry = removeSpaces(item.countryiso);
		if (firstEntry) {
			htmlStr += "<option value='" + formatCountry + "'selected>" + item.country +
				"</option>";
		}
		if (!firstEntry) {
			htmlStr += "<option value='" + formatCountry + "'>" + item.country +
				"</option>";
		}
		firstEntry = false;
	})
	$("#filter-dropdown").html(htmlStr);
}

function upDateFromSelectFilters(e) {
	var newSort = e.currentTarget.value;
	d3.select("#IND").classed("country-selected", false);
	var newClip = "#" + newSort;
	var newClip = d3.select(newClip)
	d3.select(".country-selected").classed("country-selected", false);
	newClip.classed("country-selected", true);
	_.each(dataset, function(item) {
		if (item.countryiso == newSort) {
			setCountryData(item);
		}
	})
}

function getDimensions() {
	var width = $('#mapView').width();
	var ratio = 0.8;
	return {
		width: width,
		height: width * ratio,
		scale: (width / 620)
	};
}

function drawMap() {
	var factBoxRatio
	isMobile ? factBoxRatio = 1.2 : factBoxRatio = 0.6;
	console.log(factBoxRatio);
	var dimensions = getDimensions();
	$('.timeline').css("top", (dimensions.height * factBoxRatio) + "px")
	var factBoxNewTop = (dimensions.height * factBoxRatio) + $('.timeline').outerHeight();
	$('#factbox-holder').css("top", factBoxNewTop + "px")
	$("#mapView").empty();
	// var subunits = topojson.feature(this.mapJSON, this.mapJSON.objects.countries);
	var scale = 100 * dimensions.scale;
	var translate = [dimensions.width / 2, dimensions.height / 5];
	var center = [0, 0];
	if (isZoomed) {
		scale *= 3;
		center = [95.5, 10.5];
		//center([tsunamiLon, tsunamiLat])
	}
	//var subunits = topojson.feature(this.mapJSON, this.mapJSON.objects.countries);
	//console.log(subunits)
	// if (width > 1200){
	//     height = width * 0.6
	// }
	// if (width > 700 && width < 1200){
	//     height = width * 0.45
	// }
	$("#mapView").css("height", dimensions.height);
	projection = d3.geo.robinson().scale(scale).center(center).translate(
		translate);
	svg = d3.select("#mapView").append("svg").attr('width', dimensions.width).attr(
		'height', dimensions.height).attr("id", "svg_worldmap");
	var path = d3.geo.path().projection(projection);
	var g = svg.append("g");
	var countRef = 0;
	// load and display the World
	d3.json("world-50m.json", function(error, topology) {
		
		g.selectAll("path").data(topojson.object(topology, topology.objects.countries)
				.geometries).enter().append("path").attr("class", "country")
				//.attr("centroid", function (d) { var newLocation = "{latitude:"+d.properties.latitude+",longitude:"+d.properties.longitude+"}"; return newLocation; })
				.attr("d", path).attr("id", function(d) {
				return d.properties.iso_a3;
			})
			//.on("click", function () {
			//     d3.select(".country-selected").classed("country-selected", false);
			//     d3.select(this).classed("country-selected", true);
			//     console.log(this.id);
			// });
		g.append('svg:circle').attr('cx', function() {
				return projection([tsunamiLon, tsunamiLat])[0];
			}).attr('cy', function() {
				return projection([tsunamiLon, tsunamiLat])[1];
			}).attr('r', 10).attr('id', 'tsunami_Area_Bottom').attr("fill", "#EFEFEF")
			.attr("fill-opacity", "0.1").attr("stroke", "#EFEFEF").attr(
				"stroke-opacity", "1").attr("stroke-width", "3px");
		g.append('svg:circle').attr('cx', function() {
			return projection([tsunamiLon, tsunamiLat])[0];
		}).attr('cy', function() {
			return projection([tsunamiLon, tsunamiLat])[1];
		}).attr('r', 5).attr('id', 'tsunami_Center').attr("fill", "#EFEFEF").attr(
			"fill-opacity", "1").attr("stroke", "#EFEFEF").attr("stroke-opacity",
			"0.1").attr("stroke-width", "3px");
		addListeners();
		//topojson.object(topology, topology.objects.countries).geometries)
	});
	// $(".key-item-color-four").css("background-color", exportColor);  
}

function drawCasualtiesChart(obj) {
	//$('.casualtyFigure-selected').removeClass('casualtyFigure-selected').addClass('casualtyFigure');
	var htmlStr = "  ";
	var svg16x40;
	var objTouristCount = obj.touristcasualties / 200;
	var objCount = obj.casualties / 200;
	var totalCount = totalCasualties / 200
	if (obj.casualties == "<10") {
		objTouristCount = 0;
		objCount = 10 / 200;
	}
	var k = 0;
	for (n = 0; n < objTouristCount; n++) {
		svg16x40 =
			'<svg version="1.1" class="casualtyFigure-tourist" id="casualtyFigure_' + k +
			'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="15px" height="40px" viewBox="0 0 15 40" enable-background="new 0 0 15 40" xml:space="preserve"><path d="M7.5,11.091c2.525,0,4.572-2.047,4.572-4.572c0-2.524-2.047-4.571-4.572-4.571 c-2.523,0-4.572,2.047-4.572,4.571C2.928,9.044,4.977,11.091,7.5,11.091z M7.5,11.451c-3.637,0-6.584,1.474-6.584,3.292 c0,0.04,0.01,0.079,0.012,0.119l2.316,20.104C3.349,36.098,5.211,37,7.5,37s4.15-0.902,4.256-2.034l2.315-20.104 c0.004-0.041,0.013-0.079,0.013-0.119C14.084,12.925,11.136,11.451,7.5,11.451z"/></svg>';
		htmlStr += svg16x40;
	}
	for (k = 0; k < objCount; k++) {
		svg16x40 =
			'<svg version="1.1" class="casualtyFigure-selected" id="casualtyFigure_' +
			k +
			'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="15px" height="40px" viewBox="0 0 15 40" enable-background="new 0 0 15 40" xml:space="preserve"><path d="M7.5,11.091c2.525,0,4.572-2.047,4.572-4.572c0-2.524-2.047-4.571-4.572-4.571 c-2.523,0-4.572,2.047-4.572,4.571C2.928,9.044,4.977,11.091,7.5,11.091z M7.5,11.451c-3.637,0-6.584,1.474-6.584,3.292 c0,0.04,0.01,0.079,0.012,0.119l2.316,20.104C3.349,36.098,5.211,37,7.5,37s4.15-0.902,4.256-2.034l2.315-20.104 c0.004-0.041,0.013-0.079,0.013-0.119C14.084,12.925,11.136,11.451,7.5,11.451z"/></svg>';
		htmlStr += svg16x40;
	}
	for (var i = 0; i < (totalCount - objCount); i++) {
		svg16x40 = '<svg version="1.1" class="casualtyFigure" id="casualtyFigure_' +
			i +
			'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="15px" height="40px" viewBox="0 0 15 40" enable-background="new 0 0 15 40" xml:space="preserve"><path d="M7.5,11.091c2.525,0,4.572-2.047,4.572-4.572c0-2.524-2.047-4.571-4.572-4.571 c-2.523,0-4.572,2.047-4.572,4.571C2.928,9.044,4.977,11.091,7.5,11.091z M7.5,11.451c-3.637,0-6.584,1.474-6.584,3.292 c0,0.04,0.01,0.079,0.012,0.119l2.316,20.104C3.349,36.098,5.211,37,7.5,37s4.15-0.902,4.256-2.034l2.315-20.104 c0.004-0.041,0.013-0.079,0.013-0.119C14.084,12.925,11.136,11.451,7.5,11.451z"/></svg>';
		htmlStr += svg16x40;
	}
	$("#col-4-graphic").html(htmlStr);
}

function upDateArea(obj) {
	var area = d3.select(".area");
	// WORK HERE!!!
	area.transition().attr("fill-opacity", "0.5")
	console.log(area.attr)
		// WORK HERE!!!
}

function drawAreaGraph(obj) {
	$("#areaGraphHolder").empty();
	var graphW = $("#areaGraphHolder").width();
	// var graphW = 300; 
	var graphH = 180;
	var waveGraphUnit = 0;
	var minWave = obj.waveheightminimumm;
	var maxWave = obj.waveheightmaximumm;
	_.each(dataset, function(item) {
		if (item.waveheightmaximumm > waveGraphUnit) {
			waveGraphUnit = item.waveheightmaximumm;
			waveGraphUnit = graphH / waveGraphUnit;
		}
	})
	var svg = d3.select("#areaGraphHolder").append("svg").attr("width", graphW).attr(
		"height", graphH);
	var lineData = [{
		"x": 0,
		"y": graphH
	}, {
		"x": (graphW / 5) * 1,
		"y": graphH - (minWave * waveGraphUnit)
	}, {
		"x": (graphW / 5) * 2,
		"y": graphH - 10
	}, {
		"x": (graphW / 5) * 3,
		"y": graphH - (maxWave * waveGraphUnit)
	}, {
		"x": (graphW / 5) * 4,
		"y": graphH
	}];
	// svg
	var area = d3.svg.area().interpolate("monotone").x(function(d) {
		return x(d.x);
	}).y0(graphH).y1(function(d) {
		return y(d.y);
	});
	//
	var lineFunction = d3.svg.line().x(function(d) {
		return d.x;
	}).y(function(d) {
		return d.y;
	});
	var x = d3.scale.linear().range([0, graphW]);
	var y = d3.scale.linear().range([0, graphH]);
	x.domain(d3.extent(lineData, function(d) {
		return d.x;
	}));
	y.domain([0, d3.max(lineData, function(d) {
		return d.y;
	})]);
	svg.append("path").attr("class", "area").attr("d", area(lineData));
	upDateArea(obj)
}

function updateBarGraph(obj) {
	var maxVal = 0;
	var maxValAll = 0;
	var unitVal = 0;
	_.each(dataset, function(item) {
		if (item.valueofdamagesusd != "") {
			console.log(item.valueofdamagesusd)
			maxValAll = maxValAll + item.valueofdamagesusd;
		}
	})
	console.log(formatCurrency(maxValAll))
	if (!isNaN(obj.valueofdamagesusd) && obj.valueofdamagesusd > maxVal) {
		maxVal = obj.valueofdamagesusd
	}
	maxVal = maxVal - 12;
	unitVal = ($("#bar_Value_C").height() / maxValAll)
	var damagesVal = (obj.valueofdamagesusd * unitVal);
	$('#bar_Value').css("height", damagesVal + "px");
	$('#cap_Value').html("Financial cost of tsunami damage in " + obj.country);
	$('#bar_Value_B').html(formatCurrency(obj.valueofdamagesusd))
	layoutBarGraphCaptions($('#bar_Value_B'), $('#cap_Value'), $('#bar_Value'));
}

function layoutBarGraphCaptions(caption, captionTitle, bar) {
		if ($(caption).width() < $(bar).width() || $(captionTitle).width() < $(bar).width()) {
			$(caption).css("margin-left", 3)
			$(captionTitle).css("margin-left", 3)
			$(caption).css("color", "#FFF")
			$(captionTitle).css("color", "#FFF")
		}
		if ($(caption).width() > $(bar).width() || $(captionTitle).width() > $(bar).width()) {
			$(caption).css("margin-left", 3 + $(bar).width())
			$(captionTitle).css("margin-left", 3 + $(bar).width())
			$(caption).css("color", "#EFEFEF")
			$(captionTitle).css("color", "#EFEFEF")
		}
	}
	// data into view

function setCountryData(obj) {
		var currencyStr = formatCurrency(obj.valueofdamagesusd)
		var totalCasualties;
		if (obj.casualties != "<10") {
			totalCasualties = obj.casualties + obj.touristcasualties
		} else {
			totalCasualties = obj.casualties
		}
		$('#countryTitle').html(obj.country);
		$('#col-2-caption').html("Cost of damages");
		$('#col-2-number').html(currencyStr)
		$('#col-3-caption').html("Wave height");
		$('#col-3-number').html(obj.waveheightminimumm + "–" + obj.waveheightmaximumm +
			"m")
		$('#col-4-caption').html("Casualties");
		$('#col-4-number').html(addCommas(totalCasualties))
		updateBarGraph(obj)
		drawCasualtiesChart(obj);
		drawAreaGraph(obj);
		// renderSlider();
	}
	//slider code

function addSliderListeners() {
	$(".playButton").click(function(e) {
		autoPlayData(e);
	});
}

function renderSlider() {
	timeSlider = $('#slider-range');
	addSliderListeners();
	$('#slider-range').noUiSlider({
		// Create two timestamps to define a range.
		range: {
			min: 0,
			max: 12
		},
		// Steps of one hour
		step: 1,
		// Timestamp indicates the handle starting positions.
		start: 0,
		// No decimals
		format: wNumb({
			decimals: 0
		})
	});
	$('#slider-range').on('slide', _.bind(this.readSlider, this));
}

function readSlider() {
	var newValue = parseInt(timeSlider.val());

	$("#tsunamiGraphic").css("background", "url('images/background"+newValue+".png')");
	console.log(newValue)
}

function autoPlayData(e) {
	var currClip = (e.currentTarget);
	var currentState = $(e.currentTarget).attr('data-status');
	console.log(currentState);
	if (currentState === "paused") {
		startPlaying();
		currentState = "playing";
		$(e.currentTarget).attr('data-status', currentState);
	} else if (currentState === "playing") {
		stopPlaying();
		currentState = "paused";
		$(e.currentTarget).attr('data-status', currentState);
	}

	function startPlaying() {
		var timeSlider = $('#slider-range');
		var hasLooped = false;
		var maxVal = 12;
		var tempVal = timeSlider.val();
		currClip.pauseData = false;

		function toNextPoint() {
			if (tempVal == maxVal && currentState == "paused") {
				tempVal = 0;
				timeSlider.val(0)
			}
			setTimeout(function() {
				if (!currClip.pauseData) {
					if (tempVal < maxVal) {
						tempVal++;
						toNextPoint();
						timeSlider.val(tempVal)
					} else if (tempVal === maxVal) {
						stopPlaying();
						currentState = "paused";
						$(e.currentTarget).attr('data-status', currentState);
					}
				}
			}, 500);
		}
		toNextPoint();
	}

	function stopPlaying() {
		currClip.pauseData = true;
	}
}

function timestamp(str) {
		return new Date(str).getTime();
	}
	// Append a suffix to dates.
	// Example: 23 => 23rd, 1 => 1st.

function nth(d) {
		if (d > 3 && d < 21) return 'th';
		switch (d % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	}
	// Create a string representation of the date.

function formatDate(date) {
		return weekdays[date.getDay()] + ", " + date.getDate() + nth(date.getDate()) +
			" " + months[date.getMonth()] + " " + date.getFullYear();
	}
	// Write a date as a pretty value.

function setDate(value) {
	$(this).html(formatDate(new Date(+value)));
}

function getYearData(y) {
		console.log("GETTING DATA FOR " + y)
	}
	//end date functions
	//utils

function addCommas(nStr) {
	nStr += '';
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function formatCurrency(numIn) {
		var strOut;
		if (numIn > 1000000 && numIn < 1000000000) {
			strOut = numIn / 1000000
			strOut = (Math.round(strOut * 100) / 100).toFixed(2)
			strOut = "$" + strOut + "m";
		}
		if (numIn > 1000000000) {
			strOut = numIn / 1000000000
			strOut = (Math.round(strOut * 100) / 100).toFixed(2)
			strOut = "$" + strOut + "bn";
		}
		return strOut;
	}
	//end utils

function removeSpaces(strIn) {
	var strOut = strIn.replace(/\s+/g, '_')
	return strOut;
}

function scrollPage(d) {
	var scrollTo = d.pageYOffset + d.iframeTop + currentPosition;
	iframeMessenger.scrollTo(0, scrollTo);
}

function forceIframeResize() {
	var h = $("#wrapper").innerHeight();
	iframeMessenger.resize(h);
}