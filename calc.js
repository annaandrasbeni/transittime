
function Calculations(settings, endCallback, addCallback) {

	
	// Hidden variables
	
	var pointCount = settings.pointCount();
	var results = arrayOf(pointCount, function(i) {return -1;});
	var areas = arrayOf(pointCount, function(i) {return i;});
	var self = this;
	
	// Published functions
	
	this.go = function() {
		window.setTimeout(function() {loop();}, settings.sleeptime);
	};
	
	this.setState = function(state) {
		pointCount = state.length;
		results = state;
		areas = arrayOf(pointCount, function(i) {return i;});
		// Add will remove all areas that are already calculated
		for (var i = 0; i < results.length; ++i) {
			if (results[i] > 0) {
				var loc = locationOfIndex(i);
				add(i, loc.lat, loc.lon, results[i]);
			}
		}
		
	}
	
	// Hidden functions
	
	function arrayOf(size, filler) {
		var array = [];
		while(array.length < size) {
			array.push(filler(array.length));
		}
		return array;
	};
	
	function setAreaValue(area, value) {
		areas.splice(areas.lastIndexOf(area), 1);
		results[area] = value;
	};
	
	function nextArea() {
		var index = Math.floor(Math.random() * areas.length);
		var area = areas[index];
		return area;
	}
	

	function loop() {
		if (areas.length == 0) {
			console.log(reqs);
			endCallback({message: "Calculations are done. Congratulations!", data: results});
			return;
		}
		var area = nextArea();
		var loc = locationOfIndex(area);
		calcWeight(area, loc.lat, loc.lon);
	};
	
	function locationOfIndex(area) {
		var la = Math.floor(area / settings.pointsLon);
		var lo = area % settings.pointsLon;
	
		var lat = settings.latMax - (settings.diffLat * la);
		var lon = settings.lonMin + (settings.diffLon * lo);
	
		return {"lat": lat, "lon": lon};
	}
	
	var reqs ="";
	
	function calcWeight(area, lat, lon) {
		var request = {
			origin: new google.maps.LatLng(settings.address[0], settings.address[1]),
			transitOptions: {
				departureTime: new Date(settings.departure)
			},
			destination: new google.maps.LatLng(lat, lon),
			travelMode: google.maps.DirectionsTravelMode[settings.travelMode]
		};
		function onResponse(result, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				var t = result.routes[0].legs[0].duration.value;
				add(area, lat, lon, t);
//				reqs += JSON.stringify(request) + "\n\n\n\n";
			} else if (status ===  google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
			} else {
				var t = 9007199254740992;  //MAX
				add(area, lat, lon, t);
			}
			self.go();
		};
		GOOGLE.route(request, onResponse);  
	};
	
	
	
	
	function add(area, lat, lon, t) {
		setAreaValue(area, t);
		var color = settings.colorOf(t);
		addCallback(results.length - areas.length, results);
			
		var rectangle = new google.maps.Rectangle({
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 0,
			fillColor: color,
			fillOpacity: 0.35,
			map: GOOGLE.map,
			bounds: new google.maps.LatLngBounds(
				new google.maps.LatLng(lat + settings.diffLat / 2, lon - settings.diffLon / 2),
				new google.maps.LatLng(lat - settings.diffLat / 2, lon + settings.diffLon / 2))
		});	// TODO upload
		rectangle.time = t;

	};
	
	
	
}