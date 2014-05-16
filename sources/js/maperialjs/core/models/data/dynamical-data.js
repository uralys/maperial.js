
var utils       = require('../../../../libs/utils.js'),
    Proj4js     = require('../../../libs/proj4js-compressed.js');

//----------------------------------------------------------------------------------//

function DynamicalData  () {
   
   this.points             = {};
   this.id                 = utils.generateUID();
   this.version            = 0;
   
   this.minx               = 100000000000;
   this.maxx               = -100000000000;
   this.miny               = 100000000000;
   this.maxy               = -100000000000;
   this.srcPrj             = new Proj4js.Proj('EPSG:4326'  );      //source coordinates will be in Longitude/Latitude
   this.dstPrj             = new Proj4js.Proj('EPSG:900913');     //destination coordinates google
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.addPoint = function ( latitude, longitude, data) {

    var id   = utils.generateUID(),
        p    = new Proj4js.Point(longitude, latitude);
    
   Proj4js.transform(this.srcPrj, this.dstPrj, p);
   this.minx = Math.min (this.minx , p.x);
   this.maxx = Math.max (this.maxx , p.x);
   this.miny = Math.min (this.miny , p.y);
   this.maxy = Math.max (this.maxy , p.y);

   var point = {
         id       : id,
         lat      : latitude,
         lon      : longitude,
         x        : p.x,
         y        : p.y,
         data     : data,
   };

   this.points[id] = point;
   this.version ++;
   
   return point;
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.removePoint = function (point) {
   if(point){
       delete this.points[point.id];
       this.version ++;
   }
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.removeAll = function () {
    this.points = {};
    this.version ++;
}

//------------------------------------------------------------------//

module.exports = DynamicalData;