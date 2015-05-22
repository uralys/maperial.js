module.exports = {
    createSlider : function (options){
        var container    = document.createElement('div');
        var slider       = document.createElement('input');
        var label        = document.createElement('span');

        label.innerHTML = options.label;

        slider.type      = 'range';
        slider.className = 'slider';
        slider.step      = options.step;
        slider.min       = options.min;
        slider.max       = options.max;
        slider.value     = options.value;

        slider.addEventListener("input", function (event) {
            options.modifier(event.target.valueAsNumber);
        });

        container.className = 'maperial-slider';
        container.appendChild(label);
        container.appendChild(slider);

        return container;
    }
}
