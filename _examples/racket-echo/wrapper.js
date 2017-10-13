const spawnLineByLine = require('aws-lambda-binary').spawnLineByLine;

const binaryPath = process.platform === 'darwin' ? './bin/application-mac'
    : process.platform === 'linux' ? './bin/application-lambda' : 'hostname';

const options = {
    spawn: {
        command: binaryPath
    }
};
const application = spawnLineByLine(options);

exports.handler = function (event, context) {
    application.ensureIsRunning();

    // Register the handler we want for each line response!
    application.stdout((result) => {
        context.done(null, `result: ${result}`);
    });

    application.stdin(JSON.stringify({event, context}));
};