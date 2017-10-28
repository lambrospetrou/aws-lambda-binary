.PHONY: bundle copy-shim test

test: copy-shim
	node wrapper.test.js

bundle: test
	rm -f bundle.zip
	zip -r bundle.zip node_modules wrapper.js
	echo "Now upload the bundle.zip to your AWS Lambda function which uses 'Node.js 6.10', and handler is 'handler.wrapper'"

copy-shim:
	rm -rf node_modules/aws-lambda-binary
	mkdir -p node_modules/aws-lambda-binary
	cp -r ../../lib/. node_modules/aws-lambda-binary/