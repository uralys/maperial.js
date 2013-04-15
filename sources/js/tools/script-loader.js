//=================================================================================//
//ScriptLoader
//-------------------------------------------//

/** @constructor */
function ScriptLoader(){
   this.scriptCache = new Object();
   this.scriptsRemaining = null;
   this.callbackFunction = null;
}

//-------------------------------------------//

ScriptLoader.prototype.getScripts = function(scripts, callback) 
{
   this.callbackFunction = callback;

   if(scripts.length > 0)
   {
      var script = scripts.shift();
      this.scriptsRemaining = scripts;
      this.loadScript(script);
   }
   else
   {
      if(callback)
         callback();
   }
}

//-------------------//

ScriptLoader.prototype.loadScript = function(src) 
{
   var me = this;

   if(this.scriptCache[src])
   {
      console.log("using " + src)
      this.loadNextScript();
      return;
   }

   var scriptId = "script" + this.scriptsRemaining.length + 1;
   document.write('<' + 'script id="'+scriptId+'" src="' + src + '" type="text/javascript"></script>');
   
   var script = document.getElementById(scriptId);
   script.addEventListener("load", function(){me.onload(src)}, false);
}

ScriptLoader.prototype.onload = function(src){
   console.log("loaded " + src)
   this.scriptCache[src] = "ok";
   this.loadNextScript();
} 

//-------------------//

ScriptLoader.prototype.loadNextScript = function() 
{
   this.getScripts(this.scriptsRemaining, this.callbackFunction);
}

//-------------------//

window.scriptLoader = window.scriptLoader || new ScriptLoader();
