this.OffscreenRenderer = {}

OffscreenRenderer.RenderThumbs = function(dataUrl,z,styleUrl) {
   var style      = null;
   
   $.ajax({
      type        : "GET",
      url         : styleUrl ,
      async       : false,
      dataType    : 'json',
      success     : function (data) {
         style = data;
      }
   });
   
   var toRender= null;
   $.ajax({
      type     : "GET",
      url      : dataUrl,
      dataType : "json",
      async    : false,      
      success  : function(data, textStatus, jqXHR) {
         toRender = data
      },
      error : function(jqXHR, textStatus, errorThrown) {
      }
   })
   
   if (toRender ) {
      var canvas     = document.getElementById("thumb");
      var tile       = new Object ( );
      tile.z         = z;
      tile.cnv       = null;
      tile.data      = toRender;
      tile.cnv       = canvas
      tile.cnv.height= toRender["h"];
      tile.cnv.width = toRender["w"];

      tile.ctx=tile.cnv.getContext("2d");
      ExtendCanvasContext ( tile.ctx );
      tile.ctx.globalCompositeOperation="source-over";
      tile.ctx.beginPath();
      tile.ctx.closePath();
      TileRenderer.RenderLayers (null, null ,tile.ctx , tile.data , tile.z,style ) ;
   }
}

OffscreenRenderer.RenderTile = function(x,y,z,confToLoad) {

   var tile       = null;
   var isRendered = false;
   var gl         = null;

   function Update () {
      if( ! tile.IsUpToDate () ) {
         tile.Update( 50000 )
      }
      if( tile.IsUpToDate () && !isRendered) {
         isRendered        = true;
         var vMatrix       = mat4.create();
         var pMatrix       = mat4.create();
         mat4.identity     ( pMatrix );
         mat4.ortho        ( 0, 256 , 256 , 0 , 0, 1, pMatrix ); // Y swap !
         mat4.identity     ( vMatrix );
         gl.viewport       ( 0, 0, 256 , 256 );
         gl.clear          ( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
         tile.Render       ( pMatrix, vMatrix );
         alert ("end")
      }
   }
   
   var conf       = null;
   $.ajax({
      type        : "GET",
      url         : confToLoad,
      async       : false,
      dataType    : 'json',
      success     : function (data) {
         conf = data;
      }
   });
   
   var mapCanvas     = $("#tile")[0];
   mapCanvas.width   = 256;
   mapCanvas.height  = 256;
   try {
      gl = mapCanvas.getContext("experimental-webgl");
      gl.viewportWidth  = 256;
      gl.viewportHeight = 256;
   } catch (e) { }
   if (!gl) return false;
   
   var gltools = new GLTools ()
   
   var glAsset                       = new Object();
   glAsset.ctx                       = gl;
   GlobalInitGL( glAsset , gl , gltools);
   
   var styleCache = {}
  
   
   maperial = new Maperial ("",256,256)
   maperial.stylesManager = new Object();
   maperial.stylesManager.getStyle    = function(uid) {
      if (styleCache[uid] == null) {
         $.ajax({
            type        : "GET",
            url         : "http://api.maperial.com/api/style/"+uid,
            async       : false,
            dataType    : 'json',
            success     : function (data) {
               styleCache[uid] = data;
            }
         });
      }
      return { "content" : styleCache[uid] };
   }
   
   
   //maperial.config                        = {}
   maperial.config  = maperial.emptyConfig()
   maperial.config["layers"]              = conf.layers;
   maperial.config["map"]                 = {};
   maperial.config.map                    = conf.map;
   
   //maperial.context                       = {}
   maperial.createContext()
   maperial.context.coordS = new CoordinateSystem ( Maperial.tileSize );
   maperial.context.osmVisibilities       = LayersManager.buildOSMVisibilities(conf.map.osmSets);
   maperial.context.assets                = glAsset;
   maperial.tileDLTimeOut                 = 300000 ; // 5 min max !!!
   maperial.checkConfig()
   maperial.sourcesManager                = new SourcesManager(maperial);
   maperial.mapRenderer                   = new Object();
   
   tile                                   = new Tile (maperial,x,y,z);
   console.log(maperial.config)
   maperial.mapRenderer.sourceReady       = function(source, data, x, y, z) {
      tile.appendDataToLayers( source, data );
   }
   var drawSceneInterval                  = setInterval( Update , 1 )
}
