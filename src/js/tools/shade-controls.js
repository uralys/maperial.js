
var commonTools = require('./common-tools.js');

module.exports = function ShadeControls(options) {

    var container = null;
    var layer = options.layer;
    var mapView = layer.mapView;

    var lightX = commonTools.createSlider({
        min:      -200,
        step:     1,
        max:      200,
        value:    layer.lightX(),
        modifier: layer.setLightX.bind(layer),
        label:    'Light X'
    });

    var lightY = commonTools.createSlider({
        min:      -200,
        step:     1,
        max:      200,
        value:    layer.lightY(),
        modifier: layer.setLightY.bind(layer),
        label:    'Light Y'
    });

    var lightZ = commonTools.createSlider({
        min:      10,
        step:     1,
        max:      220,
        value:    layer.lightZ(),
        modifier: layer.setLightZ.bind(layer),
        label:    'Light Z'
    });

    var scale = commonTools.createSlider({
        min:      0,
        step:     0.1,
        max:      25,
        value:    layer.scale(),
        modifier: layer.setScale.bind(layer),
        label:    'Scale'
    });

    if (options.container) {
        container = document.getElementById(options.container);
    } else {
        container = document.createElement('div');
        container.classList.add('maperial-shade-controls');
        mapView.container.appendChild(container);
    }

    container.appendChild(lightX);
    container.appendChild(lightY);
    container.appendChild(lightZ);
    container.appendChild(scale);
}

//------------------------------------------------------------------------------
