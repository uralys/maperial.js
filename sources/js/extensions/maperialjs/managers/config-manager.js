//-------------------------------------------//

function ConfigManager(){}

//==================================================================//

ConfigManager.newConfig = function() {
   return config = {hud:{elements:{}, options:{}}, map: {defaultZoom: Maperial.DEFAULT_ZOOM}, layers:[], children:[]};
}

ConfigManager.defaultConfig = function() {
   console.log("using default config");
   var config = this.newConfig();
   HUD.applyDefaultHUD(config);
   return config;
}
