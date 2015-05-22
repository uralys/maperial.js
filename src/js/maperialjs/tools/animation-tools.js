
var commonTools = require('./common-tools.js');

module.exports = function AnimationTools(options) {

    var container = null;
    var views     = options.views;

    if (options.container) {
        container = document.getElementById(options.container);
    } else {
        container = document.createElement('div');
        views[0].container.appendChild(container);
    }

    //--------------------------------------------------------------------------

    if(options.caption){
        var caption   = document.createElement('div');

        caption.className = "maperial-animation-caption";
        container.appendChild(caption);

        options.data.on('batch:changed', function(state){
            caption.innerHTML = this.properties.year;
        });
    }

    if(options.speed){
        var animationSpeed = commonTools.createSlider({
            min:      45,
            step:     5,
            max:      500,
            value:    545 - options.data.animationProperties.stepMillis,
            modifier: function(value){
                options.data.animationProperties.stepMillis = 545 - value;
            },
            label:    'Speed'
        });

        animationSpeed.className = "maperial-animation-speed";
        container.appendChild(animationSpeed);
    }

    //--------------------------------------------------------------------------
}
