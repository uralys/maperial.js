//------------------------------------------------------------------------------

var CoordinateSystem = require('../../libs/coordinate-system.js');

//------------------------------------------------------------------------------

function SimpleZoom (options) {

    var container = document.getElementById(options.container),
        views     = options.views;

    this.contexts = [];
    views.forEach(function(view){
        this.contexts.push(view.context);
    }.bind(this));


    var zoomIn  = document.createElement('div');
    var zoomOut = document.createElement('div');

    zoomIn.className  = "maperial-simple-zoom-in";
    zoomOut.className = "maperial-simple-zoom-out";

    container.appendChild(zoomIn);
    container.appendChild(zoomOut);
}

//------------------------------------------------------------------------------

module.exports = SimpleZoom;