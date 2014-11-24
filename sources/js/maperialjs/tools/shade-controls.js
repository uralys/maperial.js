
module.exports = function ShadeControls(options) {

    var container = null;
    var layer = options.layer;
    var mapView = layer.mapView;

    var lightX = createSlider({
        min:      -200,
        step:     1,
        max:      200,
        value:    layer.lightX(),
        modifier: layer.setLightX.bind(layer)
    });

    var lightY = createSlider({
        min:      -200,
        step:     1,
        max:      200,
        value:    layer.lightY(),
        modifier: layer.setLightY.bind(layer)
    });

    var lightZ = createSlider({
        min:      10,
        step:     1,
        max:      220,
        value:    layer.lightZ(),
        modifier: layer.setLightZ.bind(layer)
    });

    var scale = createSlider({
        min:      0,
        step:     0.1,
        max:      25,
        value:    layer.scale(),
        modifier: layer.setScale.bind(layer)
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

function createSlider(options){
    var slider       = document.createElement('input');

    slider.type      = 'range';
    slider.className = 'slider';
    slider.step      = options.step;
    slider.min       = options.min;
    slider.max       = options.max;
    slider.value     = options.value;

    slider.addEventListener("input", function (event) {
        options.modifier(event.target.valueAsNumber);
    });

    return slider;
}
