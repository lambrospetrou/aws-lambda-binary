const path = require("path");

const expect = require("chai").expect;
const spawnLineByLine = require("../lib").spawnLineByLine;

const cmdExit = code => ({
  spawn: {
    command: "node",
    args: ["-e", `console.error("Exiting with ${code}"); process.exit(${code})`]
  },
  withLogging: false
});

const cmdEcho = {
  spawn: {
    command: "node",
    args: ["-e", 'process.stdin.pipe(process.stdout);']
  },
  withLogging: false
};

function exitCmd(application, done) {
  if (application) {
    application.onClose(_ => {
      expect(application.__internal_p__().killed).to.be.true;
      application = null;
      done();
    });
    application.__internal_p__().kill();
  } else {
    done();
  }
}

describe('spawnLineByLine', () => {
  it('should not return null on application creation', (done) => {
    const application = spawnLineByLine(cmdEcho);
    expect(application).not.to.be.null;
    expect(application.__internal_p__().killed).not.to.be.true;
    exitCmd(application, done);
  });

  function checkSignalCode(application, fn, expectedCode, expectedSignal, done) {
    application[fn]((code, signal) => {
      expect(code).to.equal(expectedCode);
      expect(signal).to.equal(expectedSignal);
      if (expectedSignal) {
        expect(application.__internal_p__().killed).to.be.true;
      }
      done();
    });
  }

  it('should call onExit when internal process is killed', (done) => {
    const application = spawnLineByLine(cmdEcho);
    checkSignalCode(application, 'onExit', null, 'SIGTERM', done);
    application.kill();
  });

  it('should call onClose when internal process is killed', (done) => {
    const application = spawnLineByLine(cmdEcho);
    checkSignalCode(application, 'onClose', null, 'SIGTERM', done);
    application.kill();
  });

  it('should call onExit when internal process exits with any code', (done) => {
    const application = spawnLineByLine(cmdExit(1));
    checkSignalCode(application, 'onExit', 1, null, done);
  });

  it('should call onClose when internal process exits with any code', (done) => {
    const application = spawnLineByLine(cmdExit(1));
    checkSignalCode(application, 'onClose', 1, null, done);
  });
});

describe('spawnLineByLine::ensureIsRunning', () => {
  let application = null;
  afterEach(done => exitCmd(application, done));
  
  it('should not create new process if the current one is alive', () => {
    application = spawnLineByLine(cmdEcho);
    expect(application.__internal_p__().killed).not.to.be.true;
    const pid = application.__internal_p__().pid;
    application.ensureIsRunning();
    expect(application.__internal_p__().pid).to.equal(pid);
  });

  it('should create new process if the current one is killed', (done) => {
    application = spawnLineByLine(cmdEcho);
    expect(application.__internal_p__().killed).not.to.be.true;
    const pid = application.__internal_p__().pid;
    exitCmd(application, () => {
      expect(application.__internal_p__().killed).to.be.true;
      application.ensureIsRunning();
      expect(application.__internal_p__().pid).not.to.equal(pid);
      expect(application.__internal_p__().killed).not.to.be.true;
      done();
    })
  });
});

describe('spawnLineByLine::stdin/stdout', () => {
  const input = JSON.stringify({key: "value"});
  let application = null;

  afterEach(done => exitCmd(application, done));

  it('should output whatever we input', (done) => {
    application = spawnLineByLine(cmdEcho);
    application.stdout(line => {
      expect(line).to.equal(input);
      done();
    });
    application.stdin(input);
  });

  it('should be able to communicate multiple times', (done) => {
    application = spawnLineByLine(cmdEcho);
    let read = 0, total = 1000;
    application.stdout(line => {
      expect(line).to.equal(input + String(read++));
      if (read === total) {
        done();
      }
    });
    for (let i=0; i<total; i++) {
      application.stdin(input + String(i));
    }
  });
});

describe('spawnLineByLine::stderr', () => {
  it('should call the stderr callback when anything is written to stderr', (done) => {
    application = spawnLineByLine(Object.assign({}, cmdExit(1)));
    application.stderr(data => {
      expect(data).not.to.be.empty;
      exitCmd(application, done);
    });
  });
});