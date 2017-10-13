.PHONY: bundle copy-shim

bundle: copy-shim
	rm -f bundle.zip
	zip -r bundle.zip bin node_modules wrapper.js

copy-shim:
	mkdir -p node_modules
	rm -rf node_modules/aws-lambda-binary
	mkdir -p node_modules/aws-lambda-binary
	cp ../../index.js node_modules/aws-lambda-binary/