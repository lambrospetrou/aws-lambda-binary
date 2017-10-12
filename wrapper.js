const child_process = require('child_process');
const readline = require('readline');

/****************************
 * START OF WRAPPER CODE 
 ****************************/
const execPath = './application';

let proc = initProc(execPath);

function initProc(options) {
    options = options || {};
    const p = child_process.spawn(execPath);

    // Add your own custom handler if you want to handle the errors differently.
    p.stderr.on('data', (err) => {
        console.error('proc stderr: ', err);
    });

    // You might want to use ```exit``` event instead of ```close``` if you don't 
    // care about the ```stdio streams``` of the subprocess.
    // https://nodejs.org/api/child_process.html#child_process_event_close
    // https://nodejs.org/api/child_process.html#child_process_event_exit
    p.on('close', function (code) {
        if (code !== 0) {
            console.error(new Error(`Process closed with code: ${code}`));
        }
        const {handleCloseCallback} = proc;
        proc = null;
        if (handlerProcCloseCallback) {
            handlerProcCloseCallback(code);
        }
    });

    // This is the part that you get the result back from your Racket application
    // I prefer to receive lines back from the application for simplicity
    // so I use https://nodejs.org/api/readline.html#readline_event_line
    // but you can adapt this to use binary data as well, exactly like we did with
    // `stderr` above.
    const rl = readline.createInterface({ input: p.stdin, output: p.stdout });
    rl.on('line', (line) => {
        const {handlerCallback} = proc;
        if (handlerCallback) {
            handlerCallback(line);
        } 
    });

    return {
        p, rl,

        // Will be called for every **line** output from our application. 
        handlerCallback: null,

        // Will be called when the application process is closed. You can use 
        // this callback to restart it automatically or do something custom.
        handlerProcCloseCallback: null,
    };
}

function ensureProcRuns(options) {
    if (!proc) {
        proc = initProc(options);
    }
    if (options.resetCallbacks) {
        proc.handlerCallback = null;
        proc.handlerProcCloseCallback = null;
    }
}
/************************** 
 * END OF WRAPPER CODE 
 **************************/

exports.handler = function (event, context) {
    ensureProcRuns({resetCallbacks: true});

    // Register the handler we want for each line response!
    proc.handlerCallback = (result) => {
        console.log(`rkt: ${result}`);
        context.done(null, `result: ${result}`);
    };

    // Send the input to the Racket application
    proc.rl.write(`${JSON.stringify({event, context})}\n`);
};
