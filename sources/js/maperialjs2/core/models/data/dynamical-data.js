//----------------------------------------------------------------------------------//

function DynamicalData  () {
   
   this.points             = {}
   this.id                 = Utils.generateUID();
   this.version            = 0;
   
   this.content            = {"h":Maperial.tileSize , "w":Maperial.tileSize , "l" : [] }
   this.minx               = 100000000000;
   this.maxx               = -100000000000;
   this.miny               = 100000000000;
   this.maxy               = -100000000000;
   this.srcPrj             = new Proj4js.Proj('EPSG:4326'  );      //source coordinates will be in Longitude/Latitude
   this.dstPrj             = new Proj4js.Proj('EPSG:900913');     //destination coordinates google
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.addPoint = function ( latitude, longitude, data) {
   
   var id = Utils.generateUID();
   
   var p = new Proj4js.Point(longitude, latitude);   
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
   }

   this.points[id] = point;
   this.version ++
   
   return point
}

//----------------------------------------------------------------------------------//

DynamicalData.prototype.removePoint = function (point) {
   delete this.points[point.id]
}

//----------------------------------------------------------------------------------//
//oldies
//----------------------------------------------------------------------------------//
//
//DynamicalData.prototype.addPoint = function ( data , styleId , attr) {
//   var attr   = typeof attr !== 'undefined' ?  attr : null;
//   var p = new Proj4js.Point(data[1],data[0]);   
//   Proj4js.transform(this.srcPrj, this.dstPrj, p);
//   this.minx = Math.min (this.minx , p.x);
//   this.maxx = Math.max (this.maxx , p.x);
//   this.miny = Math.min (this.miny , p.y);
//   this.maxy = Math.max (this.maxy , p.y);
//   if (attr)
//      this.content.l.push ( {'c':styleId,'g':[[[p.x,p.y]]],'a':[attr]} ) ;
//   else
//      this.content.l.push ( {'c':styleId,'g':[[[p.x,p.y]]]} ) ;
//}
//
//DynamicalData.prototype.addPoints = function ( data , styleId , attr) {
//   var attr   = typeof attr !== 'undefined' ? attr : null;
//   var d = []   
//   for (var i = 0 ; i < data.length ; i = i + 1 ) {
//      var p = new Proj4js.Point(data[i][1],data[i][0]);   
//      Proj4js.transform(this.srcPrj, this.dstPrj, p);
//      this.minx = Math.min (this.minx , p.x);
//      this.maxx = Math.max (this.maxx , p.x);
//      this.miny = Math.min (this.miny , p.y);
//      this.maxy = Math.max (this.maxy , p.y);
//      d.push ( [[p.x,p.y]] )
//   }
//   if (attr && typeof attr == 'list' && attr.length == d.length)
//      this.content.l.push ( {'c':styleId,'g':d,'a':attr} ) ;
//   else
//      this.content.l.push ( {'c':styleId,'g':d} ) ;
//}
//
//DynamicalData.prototype.addLine = function ( data , styleId , closeIt, attr ) {
//   if ( data.length % 2 != 0 )
//      return;
//
//   var attr    = typeof attr !== 'undefined' ?  attr : null;
//   var close   = typeof closeIt !== 'undefined' ? closeIt : true;
//   var d       = []
//   for (var i = 0 ; i < data.length ; i = i + 2 ) {
//      var p = new Proj4js.Point(data[i+1],data[i]);   
//      Proj4js.transform(this.srcPrj, this.dstPrj, p);
//      this.minx = Math.min (this.minx , p.x);
//      this.maxx = Math.max (this.maxx , p.x);
//      this.miny = Math.min (this.miny , p.y);
//      this.maxy = Math.max (this.maxy , p.y);
//      d.push(p.x)
//      d.push(p.y)
//   }
//   if (close)
//      d.push('c')
//   else 
//      d.push('')
//
//   if (attr)
//      this.content.l.push ( {'c':styleId,'g':[[d]],'a':[attr]} ) ;
//   else
//      this.content.l.push ( {'c':styleId,'g':[[d]]} ) ;
//}
//
//DynamicalData.prototype.addLines = function ( data , styleId , closeIt, attr ) {
//   var attr    = typeof attr !== 'undefined' ?  attr : null;
//   var close   = typeof closeIt !== 'undefined' ? closeIt : true;
//   var d       = []
//   for ( var j = 0 ; j < data.length ; j = j + 1 ) {
//      var tmp = []
//      for (var i = 0 ; i < data[j].length ; i = i + 2 ) {
//         var p = new Proj4js.Point(data[j][i+1],data[j][i]);   
//         Proj4js.transform(this.srcPrj, this.dstPrj, p);
//         this.minx = Math.min (this.minx , p.x);
//         this.maxx = Math.max (this.maxx , p.x);
//         this.miny = Math.min (this.miny , p.y);
//         this.maxy = Math.max (this.maxy , p.y);
//         tmp.push(p.x)
//         tmp.push(p.y)
//      }
//      if (close)
//         tmp.push('c')
//      else 
//         tmp.push('')
//      d.push ([tmp])
//   }
//   if (attr && typeof attr == 'list' && attr.length == d.length)
//      this.content.l.push ( {'c':styleId,'g':d,'a':attr} );
//   else
//      this.content.l.push ( {'c':styleId,'g':d} ) ;
//}