
var Composition = require('../core/models/layers/composition.js'),
    Layer = require('../core/models/layer.js'),
    commonTools = require('./common-tools.js');

//------------------------------------------------------------------------------

module.exports = function FusionControls(options) {

    var container = null;
    var layer = options.layer;
    var mapView = layer.mapView;

    if (options.container) {
        container = document.getElementById(options.container);
    } else {
        container = document.createElement('div');
        container.classList.add('maperial-fusion-controls');
        mapView.container.appendChild(container);
    }

    var selector = document.createElement('select');
    selector.appendChild(option(Composition.ALPHA_BLEND));
    selector.appendChild(option(Composition.ALPHA_CLIP));
    selector.appendChild(option(Composition.X_BLEND));
    container.appendChild(selector);

    selector.addEventListener('change', function (event) {
        var mode = event.currentTarget.value;

        switch(mode){
            case Composition.ALPHA_BLEND:
                layer.setAlphaBlend();
                break;

            case Composition.ALPHA_CLIP:
                layer.setAlphaClip();
                break;

            case Composition.X_BLEND:
                layer.setXBlend();
                break;
        }

        refreshParameters(container, mode, layer);
        layer.trigger(Layer.REFRESH);
    });

    selector.value = layer.composition.type();
    refreshParameters(container, selector.value, layer);

}

//------------------------------------------------------------------------------

function option(value){
    var option       = document.createElement('option');

    option.value     = value;
    option.innerHTML = value;

    return option;
}

function refreshParameters(container, mode, layer){

    if(container.parameters){
        container.parameters.remove();
    }

    container.parameters = document.createElement('div');
    container.parameters.className = 'parameters';

    switch(mode){
        case Composition.ALPHA_BLEND:
        case Composition.ALPHA_CLIP:
            container.parameters.appendChild(commonTools.createSlider({
                min:      -1,
                step:     0.01,
                max:      1,
                value:    layer.composition.alpha(),
                modifier: layer.setAlpha.bind(layer),
                label:    'Alpha'
            }));
            break;

        case Composition.X_BLEND:
            container.parameters.appendChild(commonTools.createSlider({
                min:      -1,
                step:     0.01,
                max:      1,
                value:    layer.composition.contrast(),
                modifier: layer.setContrast.bind(layer),
                label:    'Contrast'
            }));
            container.parameters.appendChild(commonTools.createSlider({
                min:      -1,
                step:     0.01,
                max:      1,
                value:    layer.composition.luminosity(),
                modifier: layer.setLuminosity.bind(layer),
                label:    'Luminosity'
            }));
            // container.parameters.appendChild(commonTools.createSlider({
            //     min:      1,
            //     step:     1,
            //     max:      4,
            //     value:    layer.composition.xMode(),
            //     modifier: layer.setXMode.bind(layer)
            // }));
            break;
    }

    container.appendChild(container.parameters);
}
