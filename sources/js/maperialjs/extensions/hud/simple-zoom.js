//------------------------------------------------------------------------------

var CoordinateSystem = require('../../libs/coordinate-system.js');

//------------------------------------------------------------------------------

function SimpleZoom(options) {

    var container = document.getElementById(options.container),
        views = options.views;

    var zoomIn = document.createElement('div');
    var zoomOut = document.createElement('div');

    zoomIn.className = "maperial-simple-zoom-in";
    zoomOut.className = "maperial-simple-zoom-out";

    container.appendChild(zoomIn);
    container.appendChild(zoomOut);

    zoomIn.addEventListener("click", function () {
        views.forEach(function (view) {
            view.trigger("zoom-in");
        });
    });

    zoomOut.addEventListener("click", function () {
        views.forEach(function (view) {
            view.trigger("zoom-out");
        });
    });
}

//------------------------------------------------------------------------------

module.exports = SimpleZoom;
