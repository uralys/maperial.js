BPATH		=	`pwd`
BDIR		=	$(BPATH)/static
BDIRJS		=	$(BDIR)/js
ASSETS		=	$(BPATH)/assets
SOURCES		=	$(BPATH)/sources
JSPATH		=	$(SOURCES)/js
MAPERIALJS	=	$(JSPATH)/maperialjs/brfy
CSSPATH		=	$(SOURCES)/css

clean:
	@ rm -Rf $(BDIR)

tmp: 
	@ mkdir $(BDIR); mkdir $(BDIRJS)

jsdev:
	@ browserify -d -i underscore -i jsdom -i canvas $(MAPERIALJS)/core/maperial.js --standalone Maperial > $(BDIRJS)/maperial.dev.js

jsmin:
	@ browserify -i underscore -i jsdom -i canvas $(MAPERIALJS)/core/maperial.js  --standalone Maperial | uglifyjs -mt > $(BDIRJS)/maperial.min.js

dev: clean tmp jsdev
min: clean tmp jsmin
