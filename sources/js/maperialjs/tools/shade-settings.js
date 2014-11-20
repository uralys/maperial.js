//------------------------------------------------------------------------------

var CoordinateSystem = require('../libs/coordinate-system.js');

//------------------------------------------------------------------------------

function ShadeSettings(options) {

    var container = null;
    var views = options.views;
    var zoomIn = document.createElement('div');
    var zoomOut = document.createElement('div');

    if (options.container) {
        container = document.getElementById(options.container);
    } else {
        container = document.createElement('div');
        views[0].container.appendChild(container);
    }

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
