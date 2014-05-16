
var utils       = require('../../../../libs/utils.js'),
    Proj4js     = require('../../../libs/proj4js-compressed.js');

//----------------------------------------------------------------------------------//

function HeatmapData  () {
   
   this.points             = {},
   this.content            = {"h":Maperial.tileSize , "w":Maperial.tileSize , "l" : [] }
   this.id                 = utils.generateUID();
   this.version            = 0;
   this.nbPoints           = 0;
   
   this.minx               = 100000000000;
   this.maxx               = -100000000000;
   this.miny               = 100000000000;
   this.maxy               = -100000000000;
   this.srcPrj             = new Proj4js.Proj('EPSG:4326'  );      //source coordinates will be in Longitude/Latitude
   this.dstPrj             = new Proj4js.Proj('EPSG:900913');     //destination coordinates google
}

//----------------------------------------------------------------------------------//

HeatmapData.prototype.addPoint = function ( latitude, longitude, diameter, scale) {

   var id   = utils.generateUID(),
       p    = new Proj4js.Point(longitude, latitude),
       attr = {
         diameter : diameter, 
         scale    : scale
       };
   
   Proj4js.transform(this.srcPrj, this.dstPrj, p);
   this.minx = Math.min (this.minx , p.x);
   this.maxx = Math.max (this.maxx , p.x);
   this.miny = Math.min (this.miny , p.y);
   this.maxy = Math.max (this.maxy , p.y);
//
//   var point = {
//         id       : id,
//         lat      : latitude,
//         lon      : longitude,
//         x        : p.x,
//         y        : p.y,
//         diameter : diameter,
//         scale    : scale,
//   };

   var point = {'c':null,'g':[[[p.x,p.y]]],'a':[attr]}  ;

   this.content.l.push (point) ;
   this.points[id] = point;
   this.version ++;
   this.nbPoints ++;
   
   return point;
}

//----------------------------------------------------------------------------------//

HeatmapData.prototype.removePoint = function (point) {
    if(point){
        delete this.points[point.id];
        this.version ++;
        this.nbPoints --;
    }
}

//------------------------------------------------------------------//

module.exports = HeatmapData;
