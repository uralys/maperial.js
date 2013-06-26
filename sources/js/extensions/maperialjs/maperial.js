//==================================================================//

function Maperial(){
   console.log(" NEW Maperial ")
   
   this.views = []

   window.maperialSourcesManager = new SourcesManager();
   this.templateBuilder    = new TemplateBuilder();
};

//==================================================================//
//TYPE = css class

Maperial.COMPLETE   = "maperial-container";  // Main Maperial with all HUD
Maperial.LENS       = "maperial-lens";       // Child Maperial with camera centered on what is under it
Maperial.MINIFIER   = "maperial-minifier";   // Child Maperial with camera centered on the parent's center
Maperial.MAGNIFIER  = "maperial-magnifier";  // Child Maperial with camera centered on what is under the mouse

//==================================================================//

Maperial.staticURL              = (window.location.hostname.indexOf("localhost") !== -1) ? 'http://static.maperial.localhost'+ (!window.location.port || window.location.port == "9000" ? "" : ":"+window.location.port) : 'http://static.maperial.com';
Maperial.shaderURL              = (window.location.hostname.indexOf("localhost") !== -1) ? (window.location.port == "9000" ? "http://static.maperial.localhost" : 'http://' + window.location.host+'/shaders') : 'http://static.maperial.com';

Maperial.apiURL                 = 'http://api.maperial.com';

Maperial.DEFAULT_ZOOM           = 10;
Maperial.DEFAULT_LATITUDE       = 48.813;
Maperial.DEFAULT_LONGITUDE      = 2.313;

Maperial.refreshRate            = 15; // ms
Maperial.tileDLTimeOut          = 60000; //ms
Maperial.tileSize               = 256;

Maperial.autoMoveSpeedRate      = 0.2;
Maperial.autoMoveMillis         = 700;
Maperial.autoMoveDeceleration   = 0.005;
Maperial.autoMoveAnalyseSize    = 10;

Maperial.DEFAULT_STYLE_UID      = "1_style_13ed75438c8b2ed8914";
Maperial.DEFAULT_COLORBAR_UID   = "1_colorbar_13c630ec3a5068919c3";

Maperial.AlphaClip              = "AlphaClip";
Maperial.AlphaBlend             = "AlphaBlend";
Maperial.MulBlend               = "MulBlend";

//==================================================================//

Maperial.DEMO_MAP = {
 "0" : "1_map_13ee017c8dac3b49852",
 "1" : "1_map_13f18ec522f1ec62e0b",
 "2" : "1_map_13f196019c63431328a",
 "3" : "1_map_13f1969e6d19a5e46a5",
 "4" : "1_map_13f1976a6cea80a51d6",
 "5" : "1_map_13f19833d3afac2f76a",
}

//==================================================================//

Maperial.prototype.destroy = function(){
   console.log("------------------------> Maperial destroy ");
   
   window.maperialSourcesManager.releaseAllReceivers()
   
   for(var i = 0; i < this.views.length; i++){
      
      // TMP with children -> children first
      for(var j = 0; j < this.views[i].children.length; j++){
         console.log("---------------- > removing ", this.views[i].children[j].name)
         $("#panel"+this.views[i].children[j].name).remove()
      }

      this.views[i].reset()
      $("#"+this.views[i].name).remove()
      
   }
      
   this.views = []
   this.templateBuilder.destroyView();
}

//==================================================================//

Maperial.prototype.build = function(viewConfigs, options){
   
   console.log("Maperial build ", options, viewConfigs);
   $(window).trigger(MaperialEvents.LOADING);

   //-------------------------------------------------------------------//

   this.destroy()
   this.templateBuilder.prepareView();

   //-------------------------------------------------------------------//
   
   $('#TheMaperial').css('position', 'absolute');

   if(options && options.left){
      $('#TheMaperial').css('left', options.left);
   }

   if(options && options.top){
      $('#TheMaperial').css('top', options.top);
   }

   if(options && options.width)
      $('#TheMaperial').css('width', options.width);
   else
      $('#TheMaperial').css('width', $(window).width());
  
   
   if(options && options.height)
      $('#TheMaperial').css('height', options.height);
   else
      $('#TheMaperial').css('height', $(window).height());
   
   //-------------------------------------------------------------------//
   
   for(var i = 0; i < viewConfigs.length; i++){
      var view = viewConfigs[i]
      var mapView = new MapView(this, view.options)
      this.views.push (mapView)
   
      this.templateBuilder.prepareMapView(mapView);
      mapView.apply(view.config)
   }

   $(window).trigger(MaperialEvents.READY);
}
