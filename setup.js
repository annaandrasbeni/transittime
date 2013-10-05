
var init = function() {

var timeOptions = {
	values : [
	{name: "10m/15m/20m/30m/45m/1h/1.5h", value:  [     600,       900,      1200,      1800,      2700,      3600,      5400]},
	{name: "15m/30m/45m/1h/1.5h/2h/3h", value:    [     900,      1800,      2700,      3600,      5400,      7200,     10800]},
	{name: "30m/1h/1.5h/2h/3h/4h/6h", value:      [    1800,      3600,      5400,      7200,     10800,     14400,     21600]},
	{name: "2h/4h/8h/12h/16h/24h/32h", value:     [    7200,     14400,     28800,     43200,     57600,     86400,    115200]}],
	apply : function(selected, target) {
		target.times = this.values[selected].value;
	}
};

var resolutionOptions = {
	values : [
	{name: "25 x 25", value : [25, 25]},
	{name: "50 x 50", value : [50, 50]},
	{name: "100 x 100", value : [100, 100]},
	{name: "50 x 100", value : [50, 100]},
	{name: "100 x 50", value : [100, 50]}],
	apply : function(selected, target) {
		target.setResolution(this.values[selected].value[0], this.values[selected].value[1]);
	}
	
};

var travelOptions = {
	values : [
	{name: "TRANSIT"},
	{name: "WALKING"},
	{name: "DRIVING"}],
	apply : function(selected, target) {
		target.travelMode = this.values[selected].name;
	}

};

function createCombo(name, options) {
	var select = document.createElement('select');
	select.setAttribute("id", "name");
	select.onchange = function() {  options.apply(select.selectedIndex, settings)  };
	for (var i =0; i < options.values.length; ++i) {
		var opt = document.createElement('option');
		opt.setAttribute('value', options.values[i].name);
		opt.innerHTML = options.values[i].name;
		select.appendChild(opt);
	}
	return select;
}

var settings = {

	departure: function(){var date = new Date();
				date.setSeconds(0);
				date.setMinutes(0);
				date.setHours(8);
				date.setDate(date.getDate() + 7);
				while(date.getDay() !== 3) {
					date.setDate(date.getDate() + 1);
				}
				return date.valueOf()}(),
	address: [47.497691, 19.05476],
	times:  [     600,       900,      1200,      1800,      2700,      3600,      5400],
	colors: ["#00FFFF", "#00FF00", "#FFFF00", "#FF8000", "#FF0000", "#800080", "#000060", "#000000"],
	sleeptime: 1000,
	travelMode: "TRANSIT",
	

	latMax: 47.53719, 
	
	lonMin: 19.01110, 
	
	pointsLat: 25,
	pointsLon: 25,
	
	diffLat: 0.0041622,
	diffLon: 0.005208,
	
	title: "Transit time visualization",
	
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
	},
	
	setResolution : function(pointsLatNew, pointsLonNew) {
		this.diffLat = this.pointsLat / pointsLatNew * this.diffLat;
		this.diffLon = this.pointsLon / pointsLonNew * this.diffLon;
		this.pointsLat = pointsLatNew;
		this.pointsLon = pointsLonNew;
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
	if (file && !phase.fileEnabled) {
		file.parentNode.removeChild(file);
	}
	if (button && !phase.nextEnabled) {
		button.parentNode.removeChild(button);
	}
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

var fineTunePhase = {
	frameVisible: true,
	frameEditable: false,
	markerVisible: false,
	
	message: 'Please select further settings',
	fileEnabled: false,
	nextEnabled: true,
	buttonText: "Start",
	next: workPhase,
	init: function() {
		var titleField = document.createElement("input");
		titleField.setAttribute('type', 'text');
		titleField.setAttribute('id', 'title');
		var text = document.getElementById('text');
		text.appendChild(document.createElement('br'));
		text.appendChild(document.createTextNode("Coloring by:"));
		text.appendChild(createCombo('coloring', timeOptions));
		text.appendChild(document.createTextNode("Resolution:"));
		text.appendChild(createCombo('resolution', resolutionOptions));
		text.appendChild(document.createElement('br'));
		text.appendChild(document.createTextNode("Travel mode:"));
		text.appendChild(createCombo('travel_mode', travelOptions));
		text.appendChild(document.createTextNode("Title:"));
		text.appendChild(titleField);
		
	},
	cleanUp: function() {
		var titleField = document.getElementById('title');
		document.title = titleField.value;
		settings.title = titleField.value;
		var text = document.getElementById("text");
		var nodes = text.childNodes;
		for (var i = 0; i < nodes.length; ++i) {
			text.removeChild(nodes[i]);
		}
	}
};

var areaPhase = {
	frameVisible: true,
	frameEditable: true,
	markerVisible: false,
	
	message: 'Please select destination area',
	fileEnabled: false,
	nextEnabled: true,
	buttonText: "Next",
	next: fineTunePhase,
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



function loadSettings(evt) {
	var f = evt.target.files[0]; 
	if (f) {
		var r = new FileReader();
		r.onload = function(e) {
			var contents = e.target.result;
			var phase = createPhaseFromContent(contents);
			applyPhase(phase);
		}
		r.readAsText(f);
	} else { 
		alert("Failed to load file");
	}
};

function createPhaseFromContent(contents) {
	var savedObject = JSON.parse(atob(contents));
	for (property in savedObject.config) {
		if (savedObject.config.hasOwnProperty(property)) {
			settings[property] = savedObject.config[property];
		}
	}
	var phase = {
		frameVisible: true,
		frameEditable: false,
		markerVisible: false,
	
		message: "Plase wait while working",
		fileEnabled: false,
		nextEnabled: false,
		init: function() {
			document.title = settings.title;
			frame.setBounds(settings.getBounds());
			var calc = new Calculations(settings, onEnd, onAdd);
			calc.setState(savedObject.state);
			calc.go();
			console.log(settings);
		}
	};
	return phase; 
}


var onAdd = function() {
	var text = document.getElementById("text");
	
	return function(done, saveableState) {
		
		text.innerHTML = 'Calculation: ' + done + " / " + settings.pointCount()
			+ createSaveLink(saveableState);
	}
}();
	
function createSaveLink(saveableState) {
	var state = {
		config: settings,
		state: saveableState
	};
	var encodedState = btoa(JSON.stringify(state));
	return '<br><a download="transit.data" href="data:application/octet-stream,' + encodedState + '">Save state to file</a>'
		+ '<br><a href="' + getBareUrl() + '#' + encodedState + '">Copiable link</a>';
}

function getBareUrl() {
	var url = location.href;
	if (location.hash) {
		url = url.substring(0, url.lastIndexOf(location.hash));
	}
	return url;
}
	
function onEnd(status) {
	var text = document.getElementById("text");
	text.innerHTML = status.message + createSaveLink(status.data);
}

var firstPhase = loadOrCreatePhase;
if(location.hash) {
	firstPhase = createPhaseFromContent(location.hash.substring(1));
	location.hash = '';
}
applyPhase(firstPhase);

	
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