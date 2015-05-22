//------------------------------------------------------------//

function GeoLoc(mapView, inputId, goButton, geolocGranted) {

    console.log("  linking geoloc...");

    this.mapView = mapView;
    this.inputId = inputId;
    this.geolocGranted = geolocGranted;

    this.geocoder = null;

    var me = this;
    goButton.click(function () {
        me.lookForLocation()
    });

    this.tryToFindPosition();
}

//------------------------------------------------------------//

//init geocoder and geoloc
GeoLoc.prototype.tryToFindPosition = function () {
    this.geocoder = new google.maps.Geocoder();

    if (this.geolocGranted && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.positionFound);
    } else {
        this.initAutocomplete();
    }
}

//------------------------------------------------------------//

//when geoloc ajax returns
GeoLoc.prototype.positionFound = function (position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    var zoom = 13;
    this.mapView.SetCenter(lat, lon);
    this.initAutocomplete();
}

//------------------------------------------------------------//

//init autocomplete
GeoLoc.prototype.initAutocomplete = function () {
    var me = this;
    var input = document.getElementById(this.inputId);
    var options = {
        //componentRestrictions: {country: 'fr'},
        types: ['geocode']
    };
    var autocomplete = new google.maps.places.Autocomplete(input, options);
    google.maps.event.addListener(autocomplete, 'place_changed', function () {
        me.lookForLocation()
    });

    this.lookForLocation();
}

//------------------------------------------------------------//

//when button "go" is clicked or "autocomplete"
GeoLoc.prototype.lookForLocation = function () {
    var me = this;
    var address = document.getElementById(this.inputId).value;
    this.geocoder.geocode({
        'address': address
    }, function (results, status) {
        me.locationFound(results, status)
    });
}

//------------------------------------------------------------//

//when ajax geocoder returns
GeoLoc.prototype.locationFound = function (results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        var lat = results[0].geometry.location.lat();
        var lon = results[0].geometry.location.lng();
        this.mapView.SetCenter(lat, lon);
    }
}
