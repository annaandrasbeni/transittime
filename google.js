
const GOOGLE = {
map : function() {
	const center = new google.maps.LatLng(47.475, 19.062);

	const myOptions = {
		zoom: 11,
		center: center,
		mapTypeId: google.maps.MapTypeId.TERRAIN
	};

	return new google.maps.Map(document.getElementById("map-canvas"), myOptions);
	}(),
	

route : function() {
	const svc = new google.maps.DirectionsService();
	return function(request, handler) {
		svc.route(request, handler);
	};
}(),

}