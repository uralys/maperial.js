//------------------------------------------------------------------------------

var defaultXBlendParams = {
    uParams: [0.0, 0.0, 1]
};

var defaultAlphaBlendParams = {
    uParams: 0.5
};

var defaultAlphaClipParams = {
    uParams: 0.5
};

//------------------------------------------------------------------------------

/*
 * Mixins for an object to implement a composition.
 */
module.exports = {

    settings : {},
    version : 0,

    expose: function(){
        return {
            setAlpha : this.setAlpha.bind(this),
            setAlphaBlend : this.setAlphaBlend.bind(this)
        };
    },

    update: function () {
        this.version ++;
    },

    setAlphaBlend: function () {
        this.settings = {
            shader: Maperial.AlphaBlend,
            params: defaultAlphaBlendParams
        };
        this.update();
    },

    applyDefaultDynamicalComposition: function () {
        this.settings = {
            shader: Maperial.AlphaBlend,
            params: {
                uParams: 1
            }
        };
        this.update();
    },

    applyDefaultXBlend: function () {
        this.settings = {
            shader: Maperial.XBlend,
            params: defaultXBlendParams
        };
        this.update();
    },

    //--------------------------------------------------------------------------

    /**
     * Changing the alpha. Maperial.AlphaClip or Maperial.AlphaBlend
     * composirtions only
     * @param {float} alpha 0 < alpha < 1
     */
    setAlpha: function (alpha) {
        if( this.settings.shader !== Maperial.AlphaBlend &&
            this.settings.shader !== Maperial.AlphaClip ){
            console.log('Could not setAlpha : \
                -> only for Maperial.AlphaBlend or \
                Maperial.AlphaClip compositions');
            return;
        }

        if(alpha > 1 || alpha < 0){
            console.log('Could not setAlpha : check that 0 < alpha < 1');
            return;
        }

        this.composition.params.uParams = alpha;
        this.update();
    }
}
