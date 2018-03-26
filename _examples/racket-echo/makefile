.PHONY: bundle copy-shim test compile-application

test: copy-shim compile-application
	node wrapper.test.js

bundle: test
	rm -f bundle.zip
	zip -r bundle.zip bin node_modules wrapper.js

compile-application:
	mkdir -p bin
	raco exe --orig-exe -o bin/application application.rkt

copy-shim:
	rm -rf node_modules/aws-lambda-binary
	mkdir -p node_modules/aws-lambda-binary
	cp -r ../../lib/. node_modules/aws-lambda-binary/
