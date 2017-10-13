const spawnByteByByte = require('aws-lambda-binary').spawnByteByByte;

const options = {
    spawn: {
        command: 'cat'
    }
};
const application = spawnByteByByte(options);

exports.handler = function (event, context) {
    application.ensureIsRunning();

    // Register the handler we want for each line response!
    application.stdout((result) => {
        context.done(null, result);
    });

    application.stdin(`${JSON.stringify(event)}`);
};