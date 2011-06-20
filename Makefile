MAKEFLAGS = --no-print-directory --always-make
MAKE = make $(MAKEFLAGS)

BUILDDIR = build

CLOSUREURL = http://closure-compiler.googlecode.com/files/compiler-latest.zip
CLOSUREDIR = $(BUILDDIR)/closure
CLOSUREFILE = $(CLOSUREDIR)/compiler.jar

all:
	$(MAKE) build;

combine:
	cat \
		src/core.js \
		src/ajax.js \
		src/read.js \
		src/ui.js \
		> ./ply.js;

minify:
	java -jar $(CLOSUREFILE) --js_output_file=./ply.min.js --js=./ply.js; rm -rf ply.js

build:
	$(MAKE) combine;
	$(MAKE) minify;

build-update:
	$(MAKE) clean;
	mkdir $(BUILDDIR) $(CLOSUREDIR);
	cd $(CLOSUREDIR); wget -q $(CLOSUREURL) -O file.zip; tar -xf file.zip; rm -rf $(CLOSUREDIR)/file.zip

clean:
	rm -rf $(BUILDDIR);