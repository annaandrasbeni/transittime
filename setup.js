
var init = function() {


var settings = {

	departure: new Date(2013, 9, 10, 08, 0, 0, 0).valueOf(),
	address: [47.497691, 19.05476],
	times:  [     600,       900,      1200,      1800,      2700,      3600,      5400],
	colors: ["#00FFFF", "#00FF00", "#FFFF00", "#FF8000", "#FF0000", "#800080", "#000060", "#000000"],
	sleeptime: 1000,
	travelMode: "TRANSIT",
	

	latMax: 47.53719, 
	lonMin: 19.01110, 
	
	pointsLat: 35, // 35
	pointsLon: 40, // 40
	
	diffLat: 0.002973,
	diffLon: 0.003255,
	
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
	position: new google.maps.LatLng(settings.address[0], settings.address[1]),
	map: GOOGLE.map
});

var currentPhase;

function applyPhase(phase) {
	if (currentPhase && currentPhase.cleanUp) {
		currentPhase.cleanUp();
	}
	var text = document.getElementById("text");
	var file = document.getElementById("file");
	var button = document.getElementById("button");
	
	frame.setMap(phase.frameVisible ? GOOGLE.map : null);
	frame.setEditable(phase.frameEditable);
	marker.setMap(phase.markerVisible ? GOOGLE.map : null);
	text.innerHTML = phase.message;
	file.disabled = !phase.fileEnabled;
	button.disabled = !phase.nextEnabled;
	if (phase.buttonText) {
		button.value = phase.buttonText;
	}
	if (button.trackedListener) {
		button.removeEventListener("click", button.trackedListener, false);
	}
	if (phase.nextEnabled) {
		function step() {
			applyPhase(phase.next);
		}
		button.addEventListener ("click", step, false);
		button.trackedListener = step;
	}
	if (phase.init) {
		phase.init();
	}
	currentPhase = phase;

}

var workPhase = {
	frameVisible: true,
	frameEditable: false,
	markerVisible: false,
	
	message: "Plase wait while working",
	fileEnabled: false,
	nextEnabled: false,
	init: function() {
		var calc = new Calculations(settings, onEnd, onAdd);
		calc.go();
		console.log(settings);
	}
};

var areaPhase = {
	frameVisible: true,
	frameEditable: true,
	markerVisible: false,
	
	message: "Plase select destination area",
	fileEnabled: false,
	nextEnabled: true,
	buttonText: "Next",
	next: workPhase,
	init: function() {
		google.maps.event.addListener(frame, 'bounds_changed', function() {
		settings.latMax = frame.getBounds().getNorthEast().lat();
		settings.lonMin = frame.getBounds().getSouthWest().lng();
		var latMin = frame.getBounds().getSouthWest().lat();
		var lonMax = frame.getBounds().getNorthEast().lng();
		settings.diffLat = (settings.latMax - latMin) / (settings.pointsLat - 1);
		settings.diffLon = (lonMax - settings.lonMin) / (settings.pointsLon - 1);
	
	});
	},
	cleanUp: function() {
		google.maps.event.clearListeners(frame, 'bounds_changed');
	}
};

var originPhase = {
	frameVisible: false,
	frameEditable: true,
	markerVisible: true,
	
	message: "Plase select origin",
	fileEnabled: false,
	nextEnabled: true,
	buttonText: "Next",
	next: areaPhase,
	init: function() {
		google.maps.event.addListener(GOOGLE.map, 'click', function(evt) {
		settings.address = [evt.latLng.lat(), evt.latLng.lng()];
		marker.setPosition(evt.latLng);
		});
	
	},
	cleanUp: function() {
		google.maps.event.clearListeners(GOOGLE.map, 'click');
	}
};


var loadOrCreatePhase = {
	frameVisible: false,
	frameEditable: true,
	markerVisible: false,
	
	message: "Plase select file to load or setup a new calculation",
	fileEnabled: true,
	nextEnabled: true,
	buttonText: "Set up new Calculation",
	next: originPhase,
	init: function() {
		document.getElementById('file').addEventListener('change', loadSettings, false);
	}
};

function createWorkOnSavedPhase(state) {
	var phase = {
		frameVisible: true,
		frameEditable: false,
		markerVisible: false,
	
		message: "Plase wait while working",
		fileEnabled: false,
		nextEnabled: false,
		init: function() {
			frame.setBounds(settings.getBounds());
			var calc = new Calculations(settings, onEnd, onAdd);
			calc.setState(state);
			calc.go();
			console.log(settings);
		}
	};
	return phase; 
};

function loadSettings(evt) {
	var f = evt.target.files[0]; 
	if (f) {
		var r = new FileReader();
		r.onload = function(e) {
			var contents = e.target.result;
			var savedObject = JSON.parse(atob(contents));
			
			for (property in savedObject.config) {
				if (savedObject.config.hasOwnProperty(property)) {
					settings[property] = savedObject.config[property];
				}
			}
			applyPhase(createWorkOnSavedPhase(savedObject.state));
		}
		r.readAsText(f);
	} else { 
		alert("Failed to load file");
	}
};


var onAdd = function() {
	var text = document.getElementById("text");
	
	return function(done, saveableState) {
		var state = {
			config: settings,
			state: saveableState
		};
		text.innerHTML = 'Calculation: ' + done + " / " + settings.pointCount()
			+ createSaveLink(state);
	}
}();
	
function createSaveLink(state) {
	return '<br><a id="save" download="settings.json.b64" href="data:text/base64,' + btoa(JSON.stringify(state)) + '">Save state</a>';
}
	
function onEnd(status) {
	var text = document.getElementById("text");
	text.innerHTML = status.message + createSaveLink(status.data);
}

applyPhase(loadOrCreatePhase);

	
};



/*
	document.getElementById ("button").addEventListener ("click", originSelected, false);
	google.maps.event.addListener(GOOGLE.map, 'click', function(evt) {
		settings.address = [evt.latLng.lat(), evt.latLng.lng()];
		marker.setPosition(evt.latLng);
	});
	
	document.getElementById('file').addEventListener('change', loadSettings, false);


	
	
	google.maps.event.addListener(frame, 'bounds_changed', function() {
		settings.latMax = frame.getBounds().getNorthEast().lat();
		settings.lonMin = frame.getBounds().getSouthWest().lng();
		var latMin = frame.getBounds().getSouthWest().lat();
		var lonMax = frame.getBounds().getNorthEast().lng();
		settings.diffLat = (settings.latMax - latMin) / (settings.pointsLat - 1);
		settings.diffLon = (lonMax - settings.lonMin) / (settings.pointsLon - 1);
	
	});
	
	

	function areaSelected(mouseEvent, state) {
		frame.setEditable(false);
		marker.setMap(null);
		document.getElementById("button").disabled = true;
		var text = document.getElementById("text");
		text.innerHTML = 'Please wait while data is collected';
		var file = document.getElementById("file");
		file.enabled = false;
		
		var calc = new Calculations(settings, onEnd, onAdd);
		if (state) {
			calc.setState(state);
		}
		calc.go();
		console.log(settings);
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

*/
	
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