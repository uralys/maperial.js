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
function Composition(layer){

    this.layer = layer;

    this.default = {
        shader: Composition.ALPHA_BLEND,
        params: defaultAlphaBlendParams
    };

    this.settings = this.default;

    //--------------------------------------------------------------------------

    this.setAlphaBlend = function () {
        this.settings = this.default;
        this.layer.refresh();
    };

    this.applyDefaultDynamicalComposition = function () {
        this.settings = {
            shader: Composition.ALPHA_BLEND,
            params: {
                uParams: 1
            }
        };

        this.layer.refresh();
    };

    this.applyDefaultXBlend = function () {
        this.settings = {
            shader: Composition.X_BLEND,
            params: defaultXBlendParams
        };

        this.layer.refresh();
    };

    //--------------------------------------------------------------------------

    /**
     * Changing the alpha. Composition.ALPHA_CLIP or Composition.ALPHA_BLEND
     * composirtions only
     * @param {float} alpha 0 < alpha < 1
     */
    this.setAlpha = function (alpha) {
        if( this.settings.shader !== Composition.ALPHA_BLEND &&
            this.settings.shader !== Composition.ALPHA_CLIP ){
            console.log('Could not setAlpha : \
                -> only for Composition.ALPHA_BLEND or \
                Composition.ALPHA_CLIP compositions');
            return;
        }

        if(alpha > 1 || alpha < 0){
            console.log('Could not setAlpha : check that 0 < alpha < 1');
            return;
        }

        this.settings.params.uParams = alpha;
        this.layer.refresh();
    };

    //--------------------------------------------------------------------------

    // expose functions for public users
    this.api = {
        setAlphaBlend: this.setAlphaBlend.bind(this),
        setAlpha:      this.setAlpha.bind(this)
    };

}


Composition.ALPHA_CLIP  = 'AlphaClip';
Composition.ALPHA_BLEND = 'AlphaBlend';
Composition.X_BLEND     = 'XBlend';

module.exports = Composition;
