
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

    //--------------------------------------------------------------------------
}
