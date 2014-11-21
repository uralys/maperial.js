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
module.exports = function Composition() {

    this.defaultComposition = function () {
        return {
            shader: Maperial.AlphaBlend,
            params: defaultAlphaBlendParams
        };
    };

    this.defaultDynamicalComposition = function () {
        return {
            shader: Maperial.AlphaBlend,
            params: {
                uParams: 1
            }
        };
    };

    this.defaultXBlend = function () {
        return {
            shader: Maperial.XBlend,
            params: defaultXBlendParams
        };
    };
}
