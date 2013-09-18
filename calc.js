
function Calculations(settings, endCallback, addCallback) {
	
	// Published functions
	
	this.go = function() {
		window.setTimeout(function() {loop();}, settings.sleeptime);
	};
	
	// Hidden variables
	
	var pointCount = settings.pointCount();
	var results = arrayOf(pointCount, function(i) {return -1;});
	var areas = arrayOf(pointCount, function(i) {return i;});
	var self = this;
	
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
			endCallback(0, "Calculations are done. Congratulations!");
			return;
		}
		var area = nextArea();
		var la = Math.floor(area / settings.pointsLon);
		var lo = area % settings.pointsLon;
	
		var lat = settings.latMax - (settings.diffLat * la);
		var lon = settings.lonMin + (settings.diffLon * lo);
	
		calcWeight(area, lat, lon);
	};
	
	
	function calcWeight(area, lat, lon) {
		var request = {
			origin: settings.address,
			transitOptions: {
				departureTime: settings.departure
			},
			destination: new google.maps.LatLng(lat, lon),
			travelMode: google.maps.DirectionsTravelMode.TRANSIT
		};
		function onResponse(result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				var t = result.routes[0].legs[0].duration.value;
				add(area, lat, lon, t);
			} else if (status ==  google.maps.DirectionsStatus.ZERO_RESULTS) {
				var t = 9007199254740992;  //MAX
				add(area, lat, lon, t);
			} else if (status ==  google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
			} else {
				endCallback(1, "Google Directions service reported error: " + status + ". Please try again!");	
				return;
			}
			self.go();
		};
		GOOGLE.route(request, onResponse);  
	};
	
	
	
	
	function add(area, lat, lon, t) {
		setAreaValue(area, t);
		var color = settings.colorOf(t);
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
		});
		addCallback(area, lat, lon, t);
		// TODO upload
	};
	
	
	
}