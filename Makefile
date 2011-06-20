MAKEFLAGS = --no-print-directory --always-make
MAKE = make $(MAKEFLAGS)

BUILDDIR = build
SRCDIR   = src
DOCSDIR  = docs

COMBINED_FILE = ply.js
MINIFIED_FILE = ply.min.js

CLOSUREURL  = http://closure-compiler.googlecode.com/files/compiler-latest.zip
CLOSUREDIR  = $(BUILDDIR)/closure
CLOSUREFILE = $(CLOSUREDIR)/compiler.jar

all:
	$(MAKE) clean;
	$(MAKE) build;
	$(MAKE) docs;

combine:
	cat \
		src/core.js \
		src/ajax.js \
		src/read.js \
		src/ui.js \
		> $(COMBINED_FILE);

minify:
	java -jar $(CLOSUREFILE) --js_output_file=$(MINIFIED_FILE) --js=$(COMBINED_FILE); rm -rf $(COMBINED_FILE)

docs:
	if test -e $(DOCSDIR)/docco.css; then mv $(DOCSDIR)/docco.css $(DOCSDIR)/_docco.css; fi
	docco $(SRCDIR)/*
	if test -e $(DOCSDIR)/_docco.css; then mv $(DOCSDIR)/_docco.css $(DOCSDIR)/docco.css; fi

build:
	$(MAKE) combine;
	$(MAKE) minify;

build-update:
	$(MAKE) build-remove;
	mkdir $(BUILDDIR) $(CLOSUREDIR);
	cd $(CLOSUREDIR); wget -q $(CLOSUREURL) -O file.zip; tar -xf file.zip; rm -rf $(CLOSUREDIR)/file.zip

build-remove:
	rm -rf $(BUILDDIR);

clean:
	rm -rf $(DOCSDIR)/*.html;
	rm -f $(MINIFIED_FILE);