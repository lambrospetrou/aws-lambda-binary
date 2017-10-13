const spawnLineByLine = require('aws-lambda-binary').spawnLineByLine;

//const binaryPath = process.platform === 'darwin' ? './bin/application-mac'
//    : process.platform === 'linux' ? './bin/application-lambda' : './bin/application.exe';

const options = {
    spawn: {
        command: './bin/application' //binaryPath
    }
};
const application = spawnLineByLine(options);

exports.handler = function (event, context) {
    application.ensureIsRunning();

    // Register the handler we want for each line response!
    application.stdout((result) => {
        context.done(null, result);
    });

    application.stdin(JSON.stringify({event, context}));
};