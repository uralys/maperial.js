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

	//=================================================================================//

	private static final String STOP = "---STOP-OBFUSCATION";
	private static final String GO 	= "---GO-OBFUSCATION";

	//=================================================================================//

	public static void main(String[] args) throws IOException{

		//=================================================================================//

		Map<String, String> varsTag = new LinkedHashMap<String, String>();
		Map<String, String> varsMaperialJS = new LinkedHashMap<String, String>();

		varsTag.put("ScriptLoader", "_a_");
		varsTag.put("MaperialBuilder", "_x_");

		varsTag.put("scriptCache", "_t_");
		varsTag.put("scriptsRemaining", "_v_");
		varsTag.put("callbackFunction", "_h_");
		varsTag.put("getScripts", "_r_");
		varsTag.put("loadScript", "_b_");
		varsTag.put("onload", "_g_");
		varsTag.put("loadNextScript", "_c_");
		varsTag.put("loadTags", "_n_");
		varsTag.put("build", "_m_");

		varsTag.put("scriptLoader", "_ert");
		varsTag.put("maperialBuilder", "_uyt");

		varsMaperialJS.put("MapRenderer", "__a__");
		varsMaperialJS.put("MaperialEvents", "__b_");
		varsMaperialJS.put("MapParameters", "__c_");
		varsMaperialJS.put("MapMouse", "__d_");
		varsMaperialJS.put("MapMover", "__e_");
		varsMaperialJS.put("TemplateBuilder", "__f_");
		varsMaperialJS.put("HUD", "__g_");
		varsMaperialJS.put("StylesManager", "__h_");
		varsMaperialJS.put("stylesManager", "__i_");
		varsMaperialJS.put("LayersManager", "___i_");
		varsMaperialJS.put("layersManager", "___h_");
		varsMaperialJS.put("BoundingBoxDrawer", "_j_");
		varsMaperialJS.put("ColorTools", "_k_");
		varsMaperialJS.put("StyleMenu", "_l_");
		
		varsMaperialJS.put("Maperial", "__n_");
		varsTag.put("Maperial", "__n_");

		varsMaperialJS.put("ExtensionColorbar", "__m_");
//		varsMaperialJS.put("Symbolizer", "___o_"); ->> marche pas..?
		varsMaperialJS.put("CoordinateSystem", "__p_");
		varsMaperialJS.put("GeoLoc", "__q_");
		varsMaperialJS.put("HashMap", "__r_");
		varsMaperialJS.put("RGBColor", "__s_");

		varsMaperialJS.put("ImageLayer", "__t_");
		varsMaperialJS.put("RasterLayer", "__u_");
		varsMaperialJS.put("Tile", "__v_");
		varsMaperialJS.put("GLTools", "__w_");
		varsMaperialJS.put("VectorialLayer", "__x_");
		varsMaperialJS.put("RenderLine", "__y_");
		varsMaperialJS.put("TileRenderer", "__z_");

//		varsMaperialJS.put("context", "_R");
//		varsMaperialJS.put("config", "_7");
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
			Boolean pauseObfucation = false;

			br = new BufferedReader(new FileReader(input));
			
			while ((sCurrentLine = br.readLine()) != null) {
				
				if(sCurrentLine.contains(Obfuscator.STOP))
					pauseObfucation = true;

				if(sCurrentLine.contains(Obfuscator.GO))
					pauseObfucation = false;
				
				if(!pauseObfucation){
					for (String k : vars.keySet()) {
						sCurrentLine = sCurrentLine.replaceAll(k, vars.get(k));
					}
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
