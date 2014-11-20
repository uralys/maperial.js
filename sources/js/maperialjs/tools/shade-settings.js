
module.exports = function ShadeSettings(options) {

    var container = null;
    var layer = options.layer;
    var mapView = layer.mapView;

    var lightX = createSlider({
        min:      1,
        max:      200,
        modifier: layer.setLightX.bind(layer)
    });

    var lightY = createSlider({
        min:      1,
        max:      200,
        modifier: layer.setLightY.bind(layer)
    });

    var lightZ = createSlider({
        min:      1,
        max:      200,
        modifier: layer.setLightZ.bind(layer)
    });

    var scale = createSlider({
        min:      1,
        max:      200,
        modifier: layer.setScale.bind(layer)
    });

    if (options.container) {
        container = document.getElementById(options.container);
    } else {
        container = document.createElement('div');
        views[0].container.appendChild(container);
    }

    container.appendChild(lightX);
    container.appendChild(lightY);
    container.appendChild(lightZ);
    container.appendChild(scale);
}

//------------------------------------------------------------------------------

function createSlider(options){
    var slider       = document.createElement('input');
    slider.type      = 'range';
    slider.className = 'slider';
    slider.min       = options.min;
    slider.max       = options.max;

    slider.addEventListener("input", function (event) {
        options.modifier(event.target.valueAsNumber);
    });

    return slider;
}
