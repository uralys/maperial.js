//------------------------------------------------------------------------------
//  Mixin to implement a Composition.
//------------------------------------------------------------------------------

var defaultXBlendParams = {
    uParams: [0, 0, 1]
};

var defaultAlpha = {
    uParams: 0.5
};

//------------------------------------------------------------------------------

/**
 * These functions can be called on any layer to configure the fusion.
 *
 * @class
 */
function Composition(layer){

    this.layer = layer;

    this.default = {
        shader: Composition.ALPHA_BLEND,
        params: defaultAlpha
    };

    this.settings = this.default;

    //--------------------------------------------------------------------------

    /*
     * ALPHA_BLEND | ALPHA_CLIP | X_BLEND
     * @return {string} the type of fusion for this layer
     */
    this.type = function () {
        return this.settings.shader;
    };

    //--------------------------------------------------------------------------
    // Functions to change fusion type

    /**
     * Changing the fusion type to ALPHA_BLEND
     */
    this.setAlphaBlend = function () {
        this.settings = this.default;
        this.layer.refresh();
    };

    /**
     * Changing the fusion type to ALPHA_CLIP
     */
    this.setAlphaClip = function () {
        this.settings = {
            shader: Composition.ALPHA_CLIP,
            params: defaultAlpha
        };
        this.layer.refresh();
    };

    /**
     * Changing the fusion type to X_BLEND
     */
    this.setXBlend = function () {
        this.settings = {
            shader: Composition.X_BLEND,
            params: defaultXBlendParams
        };

        this.layer.refresh();
    };

    //--------------------------------------------------------------------------

    /**
     * Change the alpha.
     *
     * (ALPHA_CLIP or ALPHA_BLEND compositions only)
     *
     * @param {float} alpha 0 < alpha < 1
     */
    this.setAlpha = function (alpha) {
        if( this.type() !== Composition.ALPHA_BLEND &&
            this.type() !== Composition.ALPHA_CLIP ){
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

    /**
     * return the current alpha for this layer.
     *
     * (ALPHA_CLIP or ALPHA_BLEND compositions only)
     */
    this.alpha = function () {
        if( this.type() !== Composition.ALPHA_BLEND &&
            this.type() !== Composition.ALPHA_CLIP ){
            console.log('Could not return alpha : \
                -> only for Composition.ALPHA_BLEND or \
                Composition.ALPHA_CLIP compositions');
            return -1;
        }
        else{
            return this.settings.params.uParams;
        }
    };

    //--------------------------------------------------------------------------

    /**
     * Change the contrast.
     *
     * (X_BLEND only)
     *
     * @param {float} contrast
     */
    this.setContrast = function (contrast) {
        if( this.type() !== Composition.X_BLEND){
            console.log('Could not setContrast : \
                -> only for Composition.X_BLEND');
            return;
        }

        this.settings.params.uParams[0] = contrast;
        this.layer.refresh();
    };

    /**
     * return the contrast alpha for this layer.
     *
     * (X_BLEND only)
     */
    this.contrast = function () {
        if( this.type() !== Composition.X_BLEND){
            console.log('Could not return contrast : \
                -> only for Composition.X_BLEND');
            return -1;
        }
        else{
            return this.settings.params.uParams[0];
        }
    };

    //--------------------------------------------------------------------------

    /**
     * Change the luminosity.
     *
     * (X_BLEND only)
     *
     * @param {float} luminosity
     */
    this.setLuminosity = function (luminosity) {
        if( this.type() !== Composition.X_BLEND){
            console.log('Could not setLuminosity : \
                -> only for Composition.X_BLEND');
            return;
        }

        this.settings.params.uParams[1] = luminosity;
        this.layer.refresh();
    };

    /**
     * return the contrast alpha for this layer.
     *
     * (X_BLEND only)
     */
    this.luminosity = function () {
        if( this.type() !== Composition.X_BLEND){
            console.log('Could not return luminosity : \
                -> only for Composition.X_BLEND');
            return -1;
        }
        else{
            return this.settings.params.uParams[1];
        }
    };

    //--------------------------------------------------------------------------

    /**
     * Change the x-blend mode.
     *
     * (X_BLEND only)
     *
     * @param {int} xMode 1,2,3 or 4
     */
    this.setXMode = function (xMode) {
        if( this.type() !== Composition.X_BLEND){
            console.log('Could not setXMode : \
                -> only for Composition.X_BLEND');
            return;
        }

        // @todo check xMode in [1,2,3,4]

        this.settings.params.uParams[2] = xMode;
        this.layer.refresh();
    };

    /**
     * return the x-blend mode for this layer.
     *
     * (X_BLEND only)
     */
    this.xMode = function () {
        if( this.type() !== Composition.X_BLEND){
            console.log('Could not return xMode : \
                -> only for Composition.X_BLEND');
            return -1;
        }
        else{
            return this.settings.params.uParams[2];
        }
    };

    //--------------------------------------------------------------------------

    // expose functions for public users
    this.api = {
        setAlphaBlend: this.setAlphaBlend.bind(this),
        setAlphaClip:  this.setAlphaClip.bind(this),
        setXBlend:     this.setXBlend.bind(this),

        setAlpha:      this.setAlpha.bind(this),
        setContrast:   this.setContrast.bind(this),
        setLuminosity: this.setLuminosity.bind(this),
        setXMode:      this.setXMode.bind(this)
    };

}

//------------------------------------------------------------------------------

Composition.ALPHA_CLIP  = 'AlphaClip';
Composition.ALPHA_BLEND = 'AlphaBlend';
Composition.X_BLEND     = 'XBlend';

//------------------------------------------------------------------------------

module.exports = Composition;
