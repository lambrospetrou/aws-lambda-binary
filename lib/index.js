const child_process = require('child_process');
const readline = require('readline');
const logger = console; // No need for external logger modules

function initProc(options) {
    options = options || {};
    const {spawn, callbacks, withLogging} = options;
    const p = child_process.spawn(spawn.command, spawn.args, spawn.options);

    p.stderr.on('data', (err) => {
        if (withLogging) {
            logger.error('b-stderr::', String(err));
        }
        const {onStderr} = callbacks;
        if (onStderr) {
            onStderr(err);
        }
    });

    // https://nodejs.org/api/child_process.html#child_process_event_close
    p.on('close', function (code, signal) {
        if (withLogging && (code !== 0 || signal)) {
            logger.error(`Process closed with (code, signal): (${code}, ${signal})`);
        }
        const {onClose} = callbacks;
        if (onClose) {
            onClose(code, signal);
        }
    });

    // https://nodejs.org/api/child_process.html#child_process_event_exit
    p.on('exit', function (code, signal) {
        if (withLogging && (code !== 0 || signal)) {
            logger.error(`Process exited with (code, signal): (${code}, ${signal})`);
        }
        const {onExit} = callbacks;
        if (onExit) {
            onExit(code, signal);
        }
    });

    return {p};
}

function delegateFn(callbacks, fnName) {
    return function() {
        const fn = callbacks[fnName];
        if (fn) {
            return fn(...arguments);
        }
    };
}

/**
 * Creates a new ByteByByte application interface.
 * @param {*} options {
 *  // https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
 *  spawn: { command, args, options }
 * }
 */
function spawnByteByByte(options) {
    const {withLogging} = options;
    const wrapper = {
        onStdout: null,
        onStderr: null,
        onExit: null,
        onClose: null,
    };

    let proc = null;

    const callbacks = {
        onStderr: delegateFn(wrapper, 'onStderr'),
        onClose: delegateFn(wrapper, 'onClose'),
        onExit: delegateFn(wrapper, 'onExit')
    };

    const ensureIsRunning = () => {
        if (!proc || proc.p.killed) {
            proc = initProc(Object.assign({callbacks}, options));

            proc.p.stdout.on('data', (data) => {
                if (wrapper.onStdout) {
                    wrapper.onStdout(data);
                }
            });
        }
    };
    ensureIsRunning();

    return {
        ensureIsRunning,

        // Will call the given function for data written to `stdout` by the underlying process.
        stdout: (handler) => wrapper.onStdout = handler,
        // Will call the given function for data written to `stderr` by the underlying process.
        stderr: (handler) => wrapper.onStderr = handler,

        // Writes to the `stdin` of the underlying process!
        stdin: (data) => {
            if (!proc.p.stdin.write(data)) {
                logger.error(`Could not write the data to the stdin of the application: ${data}`);
            }
        },

        onExit: (handler) => wrapper.onExit = handler,
        onClose: (handler) => wrapper.onClose = handler,

        __internal_p__: () => proc.p,
    };
}

function setupReadLine(p, onStdout) {
    // https://nodejs.org/api/readline.html#readline_event_line
    const rl = readline.createInterface({ input: p.stdin, output: p.stdout });
    rl.on('line', (line) => {
        if (onStdout) {
            onStdout(line);
        }
    });
    return rl;
}

/**
 * Creates a new LineByLine application interface.
 * @param {*} options {
 *  // https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
 *  spawn: { command, args, options }
 * }
 */
function spawnLineByLine(options) {
    const wrapper = {
        onStdout: null,
        onStderr: null,
        onExit: null,
        onClose: null,
    };

    let proc = null;
    let rl = null;

    const onCloseExit = fn => (code, signal) => {
        if (rl) {
            try {
                rl.close();
            } catch(e) {
                logger.error(e);
            }
        }
        rl = null;
        if (fn) {
            setTimeout(() => fn(code, signal), 0);
        }
    };

    const callbacks = {
        onStderr: delegateFn(wrapper, 'onStderr'),
        onClose: onCloseExit(delegateFn(wrapper, 'onClose')),
        onExit: onCloseExit(delegateFn(wrapper, 'onExit'))
    };

    const ensureIsRunning = () => {
        if (!proc || !rl || proc.p.killed) {
            proc = initProc(Object.assign({callbacks}, options));
            rl = setupReadLine(proc.p, delegateFn(wrapper, 'onStdout'));
        }
    };
    ensureIsRunning();

    return {
        ensureIsRunning,

        // Will call the given function for every line written to `stdout` by the underlying process.
        stdout: (handler) => wrapper.onStdout = handler,
        // Will call the given function for every data written to `stderr` by the underlying process.
        stderr: (handler) => wrapper.onStderr = handler,

        // Writes to the `stdin` of the underlying process with a '\n' at the end!
        stdin: (data) => {
            rl.write(`${data}\n`);
        },

        onExit: (handler) => wrapper.onExit = handler,
        onClose: (handler) => wrapper.onClose = handler,

        // Passthrough to internal process's https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
        kill: signal => proc && proc.p && proc.p.kill(signal),

        __internal_p__: () => proc.p,
        __internal_rl_: () => rl
    };
}

module.exports = {
    spawnLineByLine, spawnByteByByte
};