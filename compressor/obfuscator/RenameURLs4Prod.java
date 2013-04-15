package obfuscator;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class RenameURLs4Prod {

	public static void main(String[] args) throws IOException{

		//=================================================================================//

		Map<String, String> urls = new HashMap<String, String>();

		urls.put("http://resources.maperial.localhost", "http://resources.maperial.com");

		//=================================================================================//
		// TAGBUILDER

		BufferedReader br = null;
		File f = new File("resources/css/maperial.webapp.min.css");
		FileWriter fw = new FileWriter(f);
		BufferedWriter bw  = new BufferedWriter(fw);

		try {

			String sCurrentLine;

			br = new BufferedReader(new FileReader("resources/css/maperial.webapp.min.css"));

			while ((sCurrentLine = br.readLine()) != null) {
				for(String k : urls.keySet()){
					sCurrentLine = sCurrentLine.replaceAll(k, urls.get(k));
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