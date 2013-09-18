
var init = function() {


var settings = {

	departure: new Date(2013, 9, 10, 08, 0, 0, 0),
	address: new google.maps.LatLng(47.497691, 19.05476),
	times:  [     600,       900,      1200,      1800,      2700,      3600,      5400],
	colors: ["#00FFFF", "#00FF00", "#FFFF00", "#FF8000", "#FF0000", "#800080", "#000060", "#000000"],
	sleeptime: 1000,
	
	

	latMax: 47.53719, 
	lonMin: 19.01110, 
	
	pointsLat: 35,
	pointsLon: 40,
	
	diffLat: 0.002973,
	diffLon: 0.003255,
	
	toString: function() {
		return "  departure: " + departure + 
			"\n  address: " + address + 
			"\n  times: " + times + 
			"\n  latMax: " + latMax + 
			"\n  lonMin: " + lonMin + 
			"\n  pointsLat: " + pointsLat + 
			"\n  pointsLon: " + pointsLon + 
			"\n  diffLat: " + diffLat + 
			"\n  diffLon: " + diffLon;
	},
	
	getBounds: function() {
		return new google.maps.LatLngBounds(
			new google.maps.LatLng(this.latMax, this.lonMin),
			new google.maps.LatLng(
					this.latMax - this.diffLat * (this.pointsLat - 1),
					this.lonMin + this.diffLon * (this.pointsLon - 1 ))
		);
	},
	
	pointCount: function() {
		return this.pointsLat * this.pointsLon;
	},
	
	colorOf: function(t) {
		var index = 0;
		for (; index < this.times.length; ++index) {
			if (t <= this.times[index]) {
				break;
			}
		}
		return this.colors[index];
	}
};


var frame = new google.maps.Rectangle({
	bounds: settings.getBounds(),
	strokeColor: '#000000',
	strokeOpacity: 0.8,
	strokeWeight: 1,
	fillColor: '#000000',
	fillOpacity: 0,
	editable: true,
	map: null
});
	
var marker = new google.maps.Marker({
	position: settings.address,
	map: GOOGLE.map
});



	document.getElementById ("button").addEventListener ("click", originSelected, false);
	google.maps.event.addListener(GOOGLE.map, 'click', function(evt) {
		settings.address = evt.latLng;
		marker.setPosition(settings.address);
	});


	
	
	google.maps.event.addListener(frame, 'bounds_changed', function() {
		settings.latMax = frame.getBounds().getNorthEast().lat();
		settings.lonMin = frame.getBounds().getSouthWest().lng();
		var latMin = frame.getBounds().getSouthWest().lat();
		var lonMax = frame.getBounds().getNorthEast().lng();
		settings.diffLat = (settings.latMax - latMin) / (settings.pointsLat - 1);
		settings.diffLon = (lonMax - settings.lonMin) / (settings.pointsLon - 1);
	
	});
	


	function areaSelected() {
		frame.setEditable(false);
		marker.setMap(null);
		document.getElementById("button").disabled = true;
		var text = document.getElementById("text");
		text.innerHTML = 'Please wait while data is collected';
		var calc = new Calculations(settings, onEnd, onAdd);
		calc.go();
		console.log(settings);
	}

	var onAdd = function() {
		var text = document.getElementById("text");
		var counter = 0;
		return function(areaIndex, lat, lon, t) {
			text.innerHTML = 'Calculation: ' + ++counter + " / " + settings.pointCount();
		}
	}();
	
	function onEnd(status, message) {
		if (0 == status) {
			calculationDone(message);
		} else {
			calculationFailed(message);
		}
	}

	function calculationDone(message) {
		var text = document.getElementById("text");
		text.innerHTML = message;

	}

	function calculationFailed(message) {
		alert(message);
	}

	function originSelected() {
		var button = document.getElementById("button");
		var text = document.getElementById("text");
		marker.setMap(null);
		frame.setMap(GOOGLE.map);
		google.maps.event.clearListeners(GOOGLE.map, 'click');
		text.innerHTML = 'Please select destination area';
		button.value = 'start';
		button.removeEventListener("click", originSelected, false);
		button.addEventListener ("click", areaSelected, false);
	}

};




	
/*	for (var i = 0; i < pointsLat; ++i) {
		for (var j = 0; j < pointsLon; ++j) {
			var lat = latMax - i * diffLat;
			var lon = lonMin + j * diffLon;
			var rectangle = new google.maps.Rectangle({
				strokeColor: '#000000',
				strokeOpacity: 0.8,
				strokeWeight: 1,
				fillColor: '#000000',
				fillOpacity: 0,
				map: map,
				bounds: new google.maps.LatLngBounds(
					new google.maps.LatLng(lat + diffLat / 2, lon - diffLon / 2),
					new google.maps.LatLng(lat - diffLat / 2, lon + diffLon / 2))
			});
			console.log(i + " " + j);
		}
	}
	
	//*/