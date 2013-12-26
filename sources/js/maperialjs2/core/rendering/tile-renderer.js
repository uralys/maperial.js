
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
         if ( zoom >= curStyle.zmax && zoom <= curStyle.zmin) {            
            for (var _ss = 0 ; _ss < curStyle.s.length ; _ss++){ 
               var params = curStyle.s[_ss];
               if ( "custom" in params && typeof (params.custom) == 'function' ) {
                  params.custom (attr)
               }
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

   //-------------------------------------------------//

   for (var i = beginAt ; i < data["l"].length ; ++i ) {
      
      var layer = data["l"][i]; // layerGroup
      var subLayerId = layer["c"]; // class - il devrait y avoir une class par Layer, pas par LayerGroup ?
      
      if( osmVisibilities != null &&  layerPosition != null &&  osmVisibilities[subLayerId] != layerPosition )
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

/**
 * 
 */
TileRenderer.RenderDynamicalLayer = function (ctx , data , zoom , style , cursor) {
    
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
    
    //-------------------------------------------------//
    // rendering points only
    // todo : render lines
    
    var i = beginAt;
    for (var id in data.points ) {
        
        var point = data.points[id];
        
        TileRenderer.ApplyStyle ( ctx, [point.x, point.y], point.data, style.symbId, zoom, style.content );
        
        if (limitTime) {
            var diffT   = (new Date).getTime() - startT;
            TileRenderer.maxRenderTime = Math.max(TileRenderer.maxRenderTime, diffT);
            if ( diffT > 10 )
                break;
        }
        
        i++;
    }
    
    //-------------------------------------------------//
    
    var diffT   = (new Date).getTime() - startT;
    if ( i < Object.keys(data.points).length )
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
   console.log ("Not yet implemented : LinePatternSymbolizer")
   // ctx.restore()
}

TileRenderer.PolygonPatternSymbolizer = function ( ctx , line , attr , params ) {
   if ( "file" in params ) {
      var symb = window.maperialSymb[params.file];
   
      ctx.save()
      RenderLine(ctx,line);
      ctx.clip()
      if ( "alpha" in params ) 
         ctx.globalAlpha=params["alpha"]
      ctx.drawImage( symb.data, 0 , 0 );
      ctx.restore()
   }
   // ctx.save()
   //console.log ("Not yet implemented : PolygonPatternSymbolizer")
   //console.log ( line )
   //console.log ( params )
   // ctx.restore()
}

TileRenderer.PointSymbolizer = function ( ctx , line , attr , params ) {
   if ( params.file in window.maperialSymb ) {
      var sx = 1.0;
      var sy = 1.0;
      if ('_sx' in ctx ) {
         sx = ctx._sx;
         sy = ctx._sy;
      }
      
      var trX = 0;
      var trY = 0;
      if ( 'trX' in params )
         trX = params.trX;
      if ( 'trY' in params )
         trY = params.trY;

      var symb = window.maperialSymb[params.file];
      if (symb.type == "svg") {
         var w    = 0.0
         var h    = 0.0
         var node = symb.data.getElementsByTagName("svg")[0]
         if (node) {
            w = parseInt(node.getAttribute("width"));
            h = parseInt(node.getAttribute("height"));
         }
         
         var shiftX = - (w / 2.0); // default centered
         var shiftY = - (h / 2.0); // default centered
         if ('centerX' in params) {
            if (params.centerX == "left")
               shiftX = 0;
            else if (params.centerX == "right")
               shiftX = -w
         }
         if ('centerY' in params) {
            if (params.centerY == "top")
               shiftY = 0;
            else if (params.centerY == "bottom")
               shiftY = -h
         }
         
         ctx.save()
         if ('_tx' in ctx ) {
            ctx.translate (ctx._tx,ctx._ty)
         }
         if ( "opacity" in params ) {
            ctx.globalAlpha=params["opacity"]
         }
         ctx.drawSvg( symb.data, (line[0]*sx) + shiftX + trX, (line[1]*sy) + shiftY + trY);
         ctx.restore()
      }
      else { //"img"
         var shiftX = -(symb.data.width / 2.0); // default centered
         var shiftY = -(symb.data.height / 2.0); // default centered
         if ('centerX' in params) {
            if (params.centerX == "left")
               shiftX = 0;
            else if (params.centerX == "right")
               shiftX = -symb.data.width
         }
         if ('centerY' in params) {
            if (params.centerY == "top")
               shiftY = 0;
            else if (params.centerY == "bottom")
               shiftY = -symb.data.height
         }
         
         ctx.save()
         if ('_tx' in ctx ) {
            ctx.translate (ctx._tx,ctx._ty)
         }
         if ( "opacity" in params ) {
            ctx.globalAlpha=params["opacity"]
         }
         ctx.drawImage( symb.data, (line[0]*sx) + shiftX + trX, (line[1]*sy) + shiftY + trY);
         ctx.restore()
      }
   }
}

TileRenderer.TextSymbolizer = function ( ctx , line , attr , params ) {
   if (! attr)
      return false;
   
   var fontname = ("face-name" in params && params["face-name"]) ? params["face-name"] : "DejaVu Sans";
   var size     = "size" in params ? params.size+"px" : "8px";   
   var font     = size + " " + fontname;
   
   ctx.save();
   ctx.SetFont(font);
   if ( "opacity" in params ) {
      ctx.globalAlpha=params["opacity"]
   }
   var fillit  = false
   var stokeit = false
   var cutSize = 0;
   var center  = false;

   var translate = [ '_tx' in ctx ? ctx._tx : 0.0 , '_ty' in ctx ? ctx._ty : 0.0 ];
   if ("dx" in params) translate[0] += parseInt( params["dx"] )
   if ("dy" in params) translate[1] += parseInt( params["dy"] )
   if ("shield-dx" in params) translate[0] += parseInt( params["shield-dx"] )
   if ("shield-dy" in params) translate[1] += parseInt( params["shield-dy"] )
   
   if ( "halo-fill" in params &&  "halo-radius" in params ) {
      ctx.lineWidth  = parseInt ( params["halo-radius"] ) * 2 ;
      ctx.strokeStyle= params["halo-fill"];
      stokeit = true
   }
   if ( "wrap-width" in params ) {
      cutSize = parseInt(params["wrap-width"]);
   }
   if (line.length > 2) {
      center = true;
   }
   if ( "placement" in params && params["placement"] == "point" ) {
      center = true;
   }
   if ( "fill" in params ) {
      ctx.fillStyle= params["fill"];
      fillit = true
   }
   var txt = attr
   if ("text-transform" in params) {
      if (params["text-transform"] == "uppercase") {
         txt = txt.toUpperCase()
      }
      else if (params["text-transform"] == "lowercase") {
         txt = txt.toLowerCase()()
      }
   }

   var colDetection = [true,true]
   if ('collisionThis' in params)
      colDetection[0] = params['collisionThis']
   if ('collisionOther' in params)
      colDetection[1] = params['collisionOther']
      
   isRenderer = false
   if (stokeit && fillit) {
      isRenderer = ctx.strokeAndFillText (txt,line,cutSize,center,translate,colDetection)
   }
   else if (stokeit) {
      isRenderer = ctx.strokeText (txt,line,cutSize,center,translate,colDetection)
   }
   else if (fillit) {
      isRenderer = ctx.fillText (txt,line,cutSize,center,translate,colDetection)
   }
   ctx.restore();
   return isRenderer;
}

TileRenderer.RasterSymbolizer = function( ctx , line , attr , params ) {
   // ctx.save()
   //console.log ("Not yet implemented : RasterSymbolizer")
   // ctx.restore()
}

TileRenderer.ShieldSymbolizer = function ( ctx , line , attr , params ) {
   rendererT = this.TextSymbolizer (ctx , line , attr + '', params)
   if (rendererT) {
      var tx,ty;
      if ("shield-dx" in params) tx = parseInt( params["shield-dx"] )
      if ("shield-dy" in params) ty = parseInt( params["shield-dy"] )
      ctx.save()
      ctx.translate (tx,ty)
      this.PointSymbolizer(ctx , line , attr , params)
      ctx.restore ( )
   }
}

TileRenderer.BuildingSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   //console.log ("Not yet implemented : BuildingSymbolizer")
   // ctx.restore()
}

TileRenderer.MarkersSymbolizer = function ( ctx , line , attr , params ) {
   var placement = "point"
   if ( "placement" in params ) placement = params["placement"]
   
   var geom;
   if (placement == "point" ) { geom = "ellipse" }
   else                       { geom = "arrow"   }
   
   if ( "marker-type" in params ) geom = params["marker-type"]
   
   var file = null
   if ( "file" in params ) file = params["file"]
   
   if ( geom == "ellipse" && placement == "point" && !file) {
      var sx = 1.0;
      var sy = 1.0;
      if ('_sx' in ctx ) {
         sx = ctx._sx;
         sy = ctx._sy;
      }
      
      ctx.save()

      if ('_tx' in ctx ) {
         ctx.translate (ctx._tx,ctx._ty)
      }
      
      var w = 10.0
      var h = 10.0
      if ( "width" in params )   {  w=parseFloat(params["width"])  }
      if ( "height" in params )  {  h=parseFloat(params["height"]) }
      
      w=h // I don't know why our style is broken => draw allipse and not circle ...
      ctx.scale(1,h/w)
      ctx.beginPath();
      ctx.arc( line[0] * sx, line[1] * sy , w ,0 , Math.PI*2 , false );
      
      if ( "stroke-opacity" in params ){  ctx.globalAlpha=params["stroke-opacity"]}
      else                             {  ctx.globalAlpha=1 }
      if ( "stroke-width" in params )  {  ctx.lineWidth = params["stroke-width"] ;}
      
      if ( "stroke" in params ) {
         ctx.strokeStyle= params["stroke"]
         ctx.stroke();
      }
      
      if ( "opacity" in params ) {  ctx.globalAlpha=params["opacity"]   }
      else                       {  ctx.globalAlpha=1                   }
      if ( "fill" in params ) {
         ctx.fillStyle= params["fill"]
         ctx.fill();
      }
      
      ctx.restore()
   }
   else {
      console.log ("Not yet implemented : MarkersSymbolizer (not ellipse / placement point)")
   }
}

TileRenderer.GlyphSymbolizer = function ( ctx , line , attr , params ) {
   // ctx.save()
   console.log ("Not yet implemented : GlyphSymbolizer")
   // ctx.restore()
}
