//==================================================================//

function Maperial(){
   console.log("==========================")
   console.log(" NEW Maperial ")
   console.log("==========================")
   
   this.options      = null
   this.views        = []

   window.maperial = this
};


//==================================================================//
// TYPE = css class

Maperial.MAIN                    = "maperial-main"
Maperial.ANCHOR                  = "maperial-anchor"
Maperial.LENS                    = "maperial-lens"       // camera centered on what is under it
Maperial.MINIFIER                = "maperial-minifier"   // camera centered on the parent's center
Maperial.MAGNIFIER               = "maperial-magnifier"  // camera centered on what is under the mouse

//==================================================================//

Maperial.staticURL              = (window.location.hostname.indexOf("localhost") !== -1) ? 'http://static.maperial.localhost'+ (!window.location.port || window.location.port == "9000" ? "" : ":"+window.location.port) : 'http://static.maperial.com';
Maperial.shaderURL              = (window.location.hostname.indexOf("localhost") !== -1) ? (window.location.port == "9000" ? "http://static.maperial.localhost" : 'http://' + window.location.host+'/shaders') : 'http://static.maperial.com';

Maperial.apiURL                 = 'http://api.maperial.com';
Maperial.tileURL                = 'http://api.maperial.com';

Maperial.DEFAULT_ZOOM           = 10;
Maperial.DEFAULT_LATITUDE       = 48.813;
Maperial.DEFAULT_LONGITUDE      = 2.313;

//Clermont City
//Maperial.DEFAULT_LATITUDE       = 45.779017;
//Maperial.DEFAULT_LONGITUDE      = 3.10617;

Maperial.bgdimg                 = "symbols/water.png";

Maperial.refreshRate            = 1000/30; // ms
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

Maperial.globalDataCpt          = 0;

//==================================================================//
