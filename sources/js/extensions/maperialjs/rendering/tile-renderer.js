
var TileRenderer = {};

//----------------------------------------------------------------------------------------------//
/*
 * subLayerId + zoom = ruleId = unique
 */

TileRenderer.layerDummyColors = [];
TileRenderer.ApplyStyle = function ( ctx , line , attr, subLayerId , zoom , style ) {

   try {
      var subLayer = style [ subLayerId ] // on a 1 seul symbolizer par layer
      
      if ( !subLayer.visible ) return;

      for (var _s = 0 ; _s < subLayer.s.length ; _s++ ) {
         var curStyle = subLayer.s[_s];

         if ( zoom >= curStyle.zmax && zoom <= curStyle.zmin ) {
            for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
               var params = curStyle.s[_ss];

               if ( TileRenderer[params.rt] ) 
                  TileRenderer[ params.rt ] ( ctx , line, attr, params )
            }
         }
      }
   }
   catch (e) {
//    console.log ( "ApplyStyle Failed : " + e );
   }
}

/**
 *  data = json qui contient toutes les donnees de la map.
 *  data["l"] = <layers> = toutes les donnees lieees au Layers
 *  			contient une liste de <layerGroup>
 *  <layerGroup> contient une liste de <layer> (ll) et une liste de sources (liee)
 *  <layer> contient une liste de <rule> 
 *  <rule> contient une liste de <style> 
 *  
 * Un layer est une liste de g group
 */
TileRenderer.maxRenderTime = 0
TileRenderer.RenderLayers = function (osmVisibilities, layerPosition , ctx , data , zoom , style , cursor  ) {

   //-------------------------------------------------//
   
   if(!data)
      return cursor;
   
   //-------------------------------------------------//

   var beginAt;
   var limitTime = false;

   if(typeof(cursor)==='undefined' || cursor == null) {
      beginAt = 0;
   }
   else {
      beginAt = cursor;
      limitTime = true;
   }

   //-------------------------------------------------//

   var date    = new Date();
   var startT  = date.getTime();

   ctx.scale(1,1);

   //-------------------------------------------------//
   
   for (var i = beginAt ; i < data["l"].length ; ++i ) {
      
      var layer = data["l"][i]; // layerGroup
      var subLayerId = layer["c"]; // class - il devrait y avoir une class par Layer, pas par LayerGroup ?
      
      if( layerPosition != null &&  osmVisibilities[subLayerId] != layerPosition)
         continue;
      
      var ll = layer["g"]; // liste de listes de lignes
      var al = null; // attributlist
      if ("a" in layer) al = layer["a"];
      if (ll == null) 
         continue;

      for ( var l = 0 ; l < ll.length ; ++l ) {
         var lines = ll[l]; // liste de lignes
         var attr  = null; // attribut
         if (al) attr = al[l] // attributlist
         for ( var li = 0 ; li < lines.length ; ++li ) 
         {
            var line = lines[li];
            TileRenderer.ApplyStyle ( ctx , line , attr , subLayerId , zoom, style );
         }
      }
      if (limitTime) {
         var diffT   = (new Date).getTime() - startT;
         TileRenderer.maxRenderTime = Math.max(TileRenderer.maxRenderTime, diffT);
         if ( diffT > 10 )
            break;

      }
   }
   
   //-------------------------------------------------//
   
   var diffT   = (new Date).getTime() - startT;
   if ( i < data["l"].length )
      return [ i+1 , diffT ];
   else 
      return [ null , diffT ] ;
}

//------------------------------------------------------------------------------------------------//

TileRenderer.FindSubLayerId = function ( point, ctx , data , zoom, styleContent, layerPosition, osmVisibilities ) {

   ctx.scale(1,1);
   var i;
   for (i = data["l"].length - 1 ; i >= 0  ; i-- ) {
      
      // render the symbolizers
      var layer = data["l"][i]; // layerGroup
      var subLayerId = layer["c"]; // class - il devrait y avoir une class par Layer, pas par LayerGroup ?
      
      if(osmVisibilities[subLayerId] != layerPosition)
         continue;

      var subLayer = styleContent [ subLayerId ];
      
      if ( !subLayer.visible ) 
         continue;
      
      // clear
      ctx.fillStyle = "#fff";
      ctx.fillRect(point.x, point.y, 1, 1);
      
      var ll = layer["g"]; // liste de listes de lignes
      var al = null; // attributlist
      if ("a" in layer) al = layer["a"]
      if (ll == null) 
         continue
         
      for ( var l = 0 ; l < ll.length ; ++l ) {
         var lines = ll[l] // liste de lignes
         var attr  = null // attribut
         if (al) attr = al[l] // attributlist
         for ( var li = 0 ; li < lines.length ; ++li ) 
         {
            TileRenderer.ApplyLookupStyle ( ctx , lines[li] , attr , subLayer , zoom);
         }
      }

      // now get the pixel and its color to know if this layer is under the click
      // NOTE : getImageData : coord for the canvas, not the ctx => no translation
      var pixel = ctx.getImageData(0, 0, 1, 1).data;
      
      // retrieve the color
      var color = ("000000" + Utils.rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6);
      
      if(color != "ffffff")
         return subLayerId;
   }
   
   return false;
}

TileRenderer.ApplyLookupStyle = function ( ctx , line , attr, subLayer , zoom  ) {
   try {
      for (var _s = 0 ; _s < subLayer.s.length ; _s++ ) {
         var curStyle = subLayer.s[_s];

         if ( zoom >= curStyle.zmax && zoom <= curStyle.zmin ) {
            for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
               var params = curStyle.s[_ss];

               if ( TileRenderer[params.rt] ) 
               { 
                  var params = jQuery.extend(true, {}, params);
                  params["alpha"] = "1";
                  params["fill"] = "#000000";
                  params["stroke"] = "#000000";

                  TileRenderer[ params.rt ] ( ctx , line, attr, params )
               }
            }
         }
      }
   }
   catch (e) {
//    console.log ( "ApplyStyle Failed : " + e );
   }
}

//----------------------------------------------------------------------------------------------//

TileRenderer.DrawImages = function (tile, ctx, wx, wy ) {
   
   if ( tile && tile.IsLoaded() && tile.IsUpToDate()) {
      ctx.beginPath();
      ctx.rect(wx, wy , Maperial.tileSize, Maperial.tileSize);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.closePath();
      
      tile.RenderVectorialLayers(ctx, wx, wy);
   }
   else {
      ctx.beginPath();
      ctx.rect(wx, wy , Maperial.tileSize, Maperial.tileSize);
      ctx.closePath();
      ctx.fillStyle = '#EEEEEE';
      ctx.fill();
      ctx.beginPath();
      ctx.closePath();
   }
}

//----------------------------------------------------------------------------------------------//
//Symbolizer rendering

TileRenderer.LineSymbolizer = function( ctx , line , attr , params ) {
   ctx.save()
   if  ( "dasharray" in params ) {
      var daStr = params  ["dasharray"].split(",");
      var da = $.map( daStr , function(n){ return parseInt(n); });
      RenderLineDA(ctx,line,da);
   }
   else {
      RenderLine(ctx,line);   
   }
   if ( "alpha" in params ) {
      ctx.globalAlpha=params["alpha"]
   }
   if ( "width" in params ) {
      ctx.lineWidth = params["width"] ;
   }
   if ( "linejoin" in params ) 
      ctx.lineJoin= params["linejoin"] ;
   if ( "linecap" in params )
      ctx.lineCap = params ["linecap"];
   if ( "stroke" in params ) {
      ctx.strokeStyle= params["stroke"]
      ctx.stroke();
   }
   ctx.restore()
}

TileRenderer.PolygonSymbolizer = function ( ctx , line , attr , params ) {
   ctx.save()
   RenderLine(ctx,line);   
   if ( "alpha" in params ) 
      ctx.globalAlpha=params["alpha"]
   if ( "fill" in params ) {
      ctx.fillStyle= params["fill"]
      ctx.fill();
   }
   ctx.restore()
}

TileRenderer.LinePatternSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : LinePatternSymbolizer")
   // ctx.restore()
}

TileRenderer.PolygonPatternSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : PolygonPatternSymbolizer")
   // ctx.restore()
}

TileRenderer.PointSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : PointSymbolizer")
   // ctx.restore()
}

TileRenderer.TextSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : TextSymbolizer")
   // ctx.restore()
}

TileRenderer.RasterSymbolizer = function( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : RasterSymbolizer")
   // ctx.restore()
}

TileRenderer.ShieldSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : ShieldSymbolizer")
   // ctx.restore()
}

TileRenderer.BuildingSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : BuildingSymbolizer")
   // ctx.restore()
}

TileRenderer.MarkersSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : MarkersSymbolizer")
   // ctx.restore()
}

TileRenderer.GlyphSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   // console.log ("Not yet implemented : GlyphSymbolizer")
   // ctx.restore()
}
