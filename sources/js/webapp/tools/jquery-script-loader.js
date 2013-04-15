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

   $.getScript(src, function(){
      console.log("loaded " + src)
      me.scriptCache[src] = "ok";
      me.loadNextScript();
   });
}

//-------------------//

ScriptLoader.prototype.loadNextScript = function() 
{
   this.getScripts(this.scriptsRemaining, this.callbackFunction);
}

//-------------------//

window.scriptLoader = window.scriptLoader || new ScriptLoader();
