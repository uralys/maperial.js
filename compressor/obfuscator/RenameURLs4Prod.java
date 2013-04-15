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

	public static void main(String[] args) throws IOException {

		// =================================================================================//

		Map<String, String> urls = new HashMap<String, String>();

		urls.put("http://static.maperial.localhost",
		      "http://static.maperial.com");

		// =================================================================================//

		rename("static/css/home.min.localhost.css", "static/css/home.min.css", urls);
		rename("static/css/maperial-js.min.localhost.css", "static/css/maperial-js.min.css", urls);
		rename("static/css/maperial-webapp.min.localhost.css", "static/css/maperial-webapp.min.css", urls);
		
		rename("static/js/home.min.localhost.js", "static/js/home.min.js", urls);
		rename("static/js/maperial-webapp.min.localhost.js", "static/js/maperial-webapp.min.js", urls);
		rename("static/js/maperial-js.min.localhost.js", "static/js/maperial-js.min.js", urls);
		rename("static/js/maperial-builder.min.localhost.js", "static/js/maperial-builder.min.js", urls);

	}

	private static void rename(String input, String output, Map<String, String> urls) throws IOException {
		BufferedReader br = null;
		File f = new File(output);
		FileWriter fw = new FileWriter(f);
		BufferedWriter bw = new BufferedWriter(fw);

		try {

			String sCurrentLine;

			br = new BufferedReader(new FileReader(input));

			while ((sCurrentLine = br.readLine()) != null) {
				for (String k : urls.keySet()) {
					sCurrentLine = sCurrentLine.replaceAll(k, urls.get(k));
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