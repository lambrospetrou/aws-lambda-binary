.PHONY: bundle copy-shim

test: copy-shim
	node wrapper.test.js

bundle: test
	rm -f bundle.zip
	zip -r bundle.zip node_modules wrapper.js
	echo "Now upload the bundle.zip to your AWS Lambda function which uses 'Node.js 6.10', and handler is 'handler.wrapper'"

copy-shim:
	mkdir -p node_modules
	rm -rf node_modules/aws-lambda-binary
	mkdir -p node_modules/aws-lambda-binary
	cp ../../index.js node_modules/aws-lambda-binary/