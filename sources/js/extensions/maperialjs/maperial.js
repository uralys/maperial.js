//==================================================================//

function Maperial(){
   console.log(" NEW Maperial ")
   
   this.views = []

   window.maperialSourcesManager = new SourcesManager();
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
Maperial.DEFAULT_LATITUDE       = 48.833;
Maperial.DEFAULT_LONGITUDE      = 2.333;

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

Maperial.prototype.reset = function(){
   console.log("Maperial reset ");
   
   window.maperialSourcesManager.releaseAllReceivers()
   
   for(var i = 0; i < this.views.length; i++)
      this.views[i].reset()
      
   this.views = []
}

Maperial.prototype.build = function(viewConfigs){
   console.log("Maperial build ", viewConfigs);
   this.reset()
   
   for(var i = 0; i < viewConfigs.length; i++){
      var view = viewConfigs[i]
      var mapView = new MapView(view.options)
      mapView.apply(view.config)
      
      this.views.push (mapView)
   }
}
