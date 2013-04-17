package obfuscator;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;


public class Obfuscator {

	public static void main(String[] args) throws IOException{

		//=================================================================================//

		Map<String, String> varsTag = new LinkedHashMap<String, String>();
		Map<String, String> varsMaperialJS = new LinkedHashMap<String, String>();

		varsTag.put("ScriptLoader", "a");
		varsTag.put("MaperialBuilder", "x");

		varsTag.put("scriptCache", "t");
		varsTag.put("scriptsRemaining", "v");
		varsTag.put("callbackFunction", "h");
		varsTag.put("getScripts", "r");
		varsTag.put("loadScript", "b");
		varsTag.put("onload", "g");
		varsTag.put("loadNextScript", "c");
		varsTag.put("loadTags", "n");
		varsTag.put("build", "m");

		varsTag.put("scriptLoader", "_ert");
		varsTag.put("maperialBuilder", "_uyt");

		varsMaperialJS.put("MapRenderer", "_a");
		varsMaperialJS.put("MaperialEvents", "_b");
		varsMaperialJS.put("MapParameters", "_c");
		varsMaperialJS.put("MapMouse", "_d");
		varsMaperialJS.put("MapMover", "_e");
		varsMaperialJS.put("TemplateBuilder", "_f");
		varsMaperialJS.put("HUD", "_g");
		varsMaperialJS.put("StylesManager", "_h");
		varsMaperialJS.put("stylesManager", "__i");
		varsMaperialJS.put("LayersManager", "_i");
		varsMaperialJS.put("layersManager", "__h");
		varsMaperialJS.put("BoundingBoxDrawer", "_j");
		varsMaperialJS.put("ColorTools", "_k");
		varsMaperialJS.put("StyleMenu", "_l");
		
		varsMaperialJS.put("Maperial", "_n");
		varsTag.put("Maperial", "_n");

		varsMaperialJS.put("ExtensionColorbar", "_m");
//		varsMaperialJS.put("Symbolizer", "___o_"); ->> marche pas..?
		varsMaperialJS.put("CoordinateSystem", "_p");
		varsMaperialJS.put("GeoLoc", "_q");
		varsMaperialJS.put("HashMap", "_r");
		varsMaperialJS.put("RGBColor", "_s");

		varsMaperialJS.put("ImageLayer", "_t");
		varsMaperialJS.put("RasterLayer", "_u");
		varsMaperialJS.put("Tile", "_v");
		varsMaperialJS.put("GLTools", "_w");
		varsMaperialJS.put("VectorialLayer", "_x");
		varsMaperialJS.put("RenderLine", "_y");
		varsMaperialJS.put("TileRenderer", "_z");

		varsMaperialJS.put("context", "_R");
		varsMaperialJS.put("config", "_7");
//		varsMaperialJS.put("parameters", "_7_"); --> attention il y a un truc qui sappelle parameters dans une des libs

		//=================================================================================//

		replaceAll("static/js/maperial-builder.min.js", "static/js/maperial-builder.o.js", varsTag);
		replaceAll("static/js/maperial-js.min.js", "static/js/maperial-js.o.js", varsMaperialJS);
		replaceAll("static/js/maperial-webapp.min.js", "static/js/maperial-webapp.o.js", varsMaperialJS);

		//=================================================================================//

	}
	
	private static void replaceAll(String input, String output, Map<String, String> vars) throws IOException {

		BufferedReader br = null;
		File f = new File(output);
		FileWriter fw = new FileWriter(f);
		BufferedWriter bw = new BufferedWriter(fw);

		try {

			String sCurrentLine;

			br = new BufferedReader(new FileReader(input));

			while ((sCurrentLine = br.readLine()) != null) {
				
				for (String k : vars.keySet()) {
					sCurrentLine = sCurrentLine.replaceAll(k, vars.get(k));
				}

				bw.write(sCurrentLine);
				bw.write("\n");
			}

		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (br != null)
					br.close();
				if (bw != null)
					bw.close();
				if (fw != null)
					fw.close();
			} catch (IOException ex) {
				ex.printStackTrace();
			}
		}
   }
}
