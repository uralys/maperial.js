package obfuscator;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;


public class Obfuscator {

	public static void main(String[] args) throws IOException{

		//=================================================================================//

		Map<String, String> varsTag = new HashMap<String, String>();
		Map<String, String> varsMaperialJS = new HashMap<String, String>();

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
		// TAGBUILDER

		BufferedReader br = null;
		File f = new File("/Users/mad/Projects/Maperial/mycarto/wwwClient/js/min/maperial-builder.o.js");
		FileWriter fw = new FileWriter(f);
		BufferedWriter bw  = new BufferedWriter(fw);

		try {

			String sCurrentLine;

			br = new BufferedReader(new FileReader("/Users/mad/Projects/Maperial/mycarto/wwwClient/js/min/maperial-builder.min.js"));

			while ((sCurrentLine = br.readLine()) != null) {
				for(String k : varsTag.keySet()){
					sCurrentLine = sCurrentLine.replaceAll(k, varsTag.get(k));
				}

				bw.write(sCurrentLine);
				bw.write("\n");
			}

		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (br != null)br.close();
				if (bw != null)bw.close();
				if (fw != null)fw.close();
			} catch (IOException ex) {
				ex.printStackTrace();
			}
		}


		//=================================================================================//
		// MAPERIALJS

		br = null;
		f = new File("/Users/mad/Projects/Maperial/mycarto/wwwClient/js/min/maperial-js.o.js");
		fw = new FileWriter(f);
		bw  = new BufferedWriter(fw);

		try {

			String sCurrentLine;

			br = new BufferedReader(new FileReader("/Users/mad/Projects/Maperial/mycarto/wwwClient/js/min/maperial-js.min.js"));

			while ((sCurrentLine = br.readLine()) != null) {
				for(String k : varsMaperialJS.keySet()){
					sCurrentLine = sCurrentLine.replaceAll(k, varsMaperialJS.get(k));
				}

				bw.write(sCurrentLine);
				bw.write("\n");
			}

		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (br != null)br.close();
				if (bw != null)bw.close();
				if (fw != null)fw.close();
			} catch (IOException ex) {
				ex.printStackTrace();
			}
		}
		
		//=================================================================================//
		// Webapp
		
		br = null;
		f = new File("/Users/mad/Projects/Maperial/mycarto/wwwClient/js/min/maperial-webapp.o.js");
		fw = new FileWriter(f);
		bw  = new BufferedWriter(fw);
		
		try {
			String sCurrentLine;
			
			br = new BufferedReader(new FileReader("/Users/mad/Projects/Maperial/mycarto/wwwClient/js/min/maperial-webapp.min.js"));
			
			while ((sCurrentLine = br.readLine()) != null) {
				for(String k : varsMaperialJS.keySet()){
					sCurrentLine = sCurrentLine.replaceAll(k, varsMaperialJS.get(k));
				}
				
				bw.write(sCurrentLine);
				bw.write("\n");
			}
			
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (br != null)br.close();
				if (bw != null)bw.close();
				if (fw != null)fw.close();
			} catch (IOException ex) {
				ex.printStackTrace();
			}
		}
	}
}
