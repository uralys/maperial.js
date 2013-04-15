// -------------------------------------------//
//	 			ScriptLoader
// -------------------------------------------//

this.ScriptLoader = {};

ScriptLoader.scriptCache = new Object();
ScriptLoader.scriptsRemaining;
ScriptLoader.callbackFunction;
		
// -------------------------------------------//

ScriptLoader.getScripts = function(scripts, callback) 
{
	ScriptLoader.callbackFunction = callback;
	
	if(scripts.length > 0)
	{
		var script = scripts.shift();
		ScriptLoader.scriptsRemaining = scripts;
		ScriptLoader.loadScript(script);
	}
	else
	{
		callback();
	}
}

// -------------------//

ScriptLoader.loadScript = function(src) 
{
	
	if(ScriptLoader.scriptCache[src])
	{
		ScriptLoader.loadNextScript();
		return;
	}

	console.log("loading " + src);
	
	$.getScript(src, function() 
	{
		ScriptLoader.scriptCache[src] = "ok";
		ScriptLoader.loadNextScript();
	});
	   
}

// -------------------//

ScriptLoader.loadNextScript = function() 
{
	ScriptLoader.getScripts(ScriptLoader.scriptsRemaining, ScriptLoader.callbackFunction);
}

// ----------------------------//