var utils = require('../../../../libs/utils.js'),
    _     = require('../../../../libs/lodash.js'),
    Layer = require('../layer.js');

//---------------------------------------------------------------------------

/**
 * Add shade on your maps
 *
 * @constructor
 */
function ShadeLayer(composition) {
    this.id = utils.generateUID();
    this.type = Layer.Shade;
    this.params = this.default();
    this.composition = composition;
}
//---------------------------------------------------------------------------

ShadeLayer.prototype.default = function () {
    return {
        uLight: [10, 10, 20],
        scale: 10
    };
}

//---------------------------------------------------------------------------

/**
 * [setLightX description]
 * @param {int} newX [description]
 */
ShadeLayer.prototype.setLightX = function (newX) {
    this.version();
    this.params.uLight[0] = newX;
}

/**
 * [setLightY description]
 * @param {int} newY [description]
 */
ShadeLayer.prototype.setLightY = function (newY) {
    this.version();
    this.params.uLight[1] = newY;
}

/**
 * [setLightZ description]
 * @param {int} newZ [description]
 */
ShadeLayer.prototype.setLightZ = function (newZ) {
    this.version();
    this.params.uLight[2] = newZ;
}

/**
 * [setScale description]
 * @param {int} newScale [description]
 */
ShadeLayer.prototype.setScale = function (newScale) {
    this.version();
    this.params.scale = newScale;
}

//---------------------------------------------------------------------------

/**
 * [animateLightX description]
 * @param {int} from [description]
 * @param {int} to [description]
 */
ShadeLayer.prototype.animateLightX = function (from, to) {
    var set = function (){
        var way = Math.abs(to-from)/(to-from);
        this.setLightX(from);
        var next = from + way;
        if((next - to)*way < 0){
            this.animateLightX(next, to);
        }
        else{
            this.setLightX(to);
        }
    }.bind(this);

    requestAnimationFrame(set);
}

//---------------------------------------------------------------------------
// Private
//---------------------------------------------------------------------------

ShadeLayer.prototype.version = function () {
    this.params = _.cloneDeep(this.params);
}

//---------------------------------------------------------------------------

module.exports = ShadeLayer;
