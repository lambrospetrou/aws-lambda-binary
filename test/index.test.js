const path = require("path");

const expect = require("chai").expect;
const spawnLineByLine = require("../lib").spawnLineByLine;
const spawnByteByByte = require("../lib").spawnByteByByte;

const cmdExit = (code, readOnce) => ({
  spawn: {
    command: "node",
    args: ["-e", `
      const readline = require("readline");
      const rl = readline.createInterface({ input: process.stdin });
      rl.on('line', (line) => {
        process.stderr.write(\`Exit code: ${code}\n\`);
        process.exit(${code});
      });
      if (${!readOnce}) {
        process.exit(${code});
      }
    `]
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

const cmdSum = {
  spawn: {
    command: "node",
    args: [ "-e", `
      let sum = 0, totalNumbers = 0;
      process.stdin.on('data', (data) => {
        const arr = String(data).split('').filter(c => c !== "\\n");
        arr.forEach(n => sum += Number(n));
        totalNumbers += arr.length;
        process.stdout.write(\`\${totalNumbers} \${String(sum)}\n\`);
      });
    `
    ]
  },
  withLogging: false
};

function exitCmd(application, done) {
  if (application) {
    application.onClose(_ => {
      expect(application.__internal_p__().killed).to.be.true;
      expect(application.isRunning()).to.be.false;
      application = null;
      done();
    });
    application.__internal_p__().kill();
  } else {
    done();
  }
}

function repeatForAllProtocols(test) {
  [spawnLineByLine, spawnByteByByte].forEach(spawnFn => {
    test(spawnFn);
  });
}

repeatForAllProtocols(spawnFn => {
  describe(`${spawnFn.name} spawn/onExit/onClose`, () => {
    function checkSignalCode(application, fn, expectedCode, expectedSignal, done) {
      application[fn]((code, signal) => {
        expect(code).to.equal(expectedCode);
        expect(signal).to.equal(expectedSignal);
        if (expectedSignal) {
          expect(application.__internal_p__().killed).to.be.true;
        }
        expect(application.isRunning()).to.be.false;
        done();
      });
    }
    
    it('should not return null on application creation', (done) => {
      const application = spawnFn(cmdEcho);
      expect(application).not.to.be.null;
      expect(application.isRunning()).to.be.true;
      exitCmd(application, done);
    });

    it('should call onExit when internal process is killed', (done) => {
      const application = spawnFn(cmdEcho);
      checkSignalCode(application, 'onExit', null, 'SIGTERM', done);
      application.kill();
    });

    it('should call onClose when internal process is killed', (done) => {
      const application = spawnFn(cmdEcho);
      checkSignalCode(application, 'onClose', null, 'SIGTERM', done);
      application.kill();
    });

    it('should call onExit when internal process exits with any code', (done) => {
      const application = spawnFn(cmdExit(1));
      checkSignalCode(application, 'onExit', 1, null, done);
    });

    it('should call onClose when internal process exits with any code', (done) => {
      const application = spawnFn(cmdExit(1));
      checkSignalCode(application, 'onClose', 1, null, done);
    });
  });
});

repeatForAllProtocols(spawnFn => {
  describe(`${spawnFn.name}::ensureIsRunning`, () => {
    let application = null;
    afterEach(done => exitCmd(application, done));
    
    it('should not create new process if the current one is alive', () => {
      application = spawnFn(cmdEcho);
      expect(application.isRunning()).to.be.true;
      const pid = application.__internal_p__().pid;
      application.ensureIsRunning();
      expect(application.__internal_p__().pid).to.equal(pid);
    });

    it('should create new process if the current one is killed', (done) => {
      application = spawnFn(cmdEcho);
      expect(application.isRunning()).to.be.true;
      const pid = application.__internal_p__().pid;
      exitCmd(application, () => {
        expect(application.__internal_p__().killed).to.be.true;
        expect(application.isRunning()).not.to.be.true;
        application.ensureIsRunning();
        expect(application.__internal_p__().pid).not.to.equal(pid);
        expect(application.__internal_p__().killed).not.to.be.true;
        expect(application.isRunning()).to.be.true;
        done();
      })
    });

    it('should create new process if the current one exits', (done) => {
      application = spawnFn(cmdExit(1, true));
      expect(application.__internal_p__().killed).not.to.be.true;
      expect(application.isRunning()).to.be.true;
      const pid = application.__internal_p__().pid;
      application.onClose((code, signal) => {
        expect(code).to.eql(1);
        expect(signal).to.be.null;
        // Restart process
        application.ensureIsRunning();
        expect(application.__internal_p__().pid).not.to.equal(pid);
        expect(application.isRunning()).to.be.true;
        done();
      });

      application.stdin('some input text\n'); // to cause it to exit
    });
  });
});

repeatForAllProtocols(spawnFn => {
  describe(`${spawnFn.name}::stderr`, () => {
    it('should call the stderr callback when anything is written to stderr', (done) => {
      application = spawnFn(Object.assign({}, cmdExit(1, true)));
      application.stderr(data => {
        expect(data).not.to.be.empty;
        exitCmd(application, done);
      });
      application.stdin('something to cause the stderr output\n');
    });
  });
});

repeatForAllProtocols(spawnFn => {
  describe(`${spawnFn.name}::stdin/stdout multiple times`, () => {
    let application = null;
    afterEach(done => exitCmd(application, done));

    it('should be able to communicate multiple times - sum', (done) => {
      let dataToWrite = '', total = 1000, sum = 0;
      for (let i=0; i<total; i++) {
        const n = i%10;
        sum += n;
        dataToWrite += String(n);
      }
  
      application = spawnFn(cmdSum);
      application.stdout(line => {
        const segments = String(line).split(' ');
        if (Number(segments[0]) === total) {
          expect(Number(segments[1])).to.eql(sum);
          done();
        }
      });
  
      for (let i=0; i<total; i++) {
        application.stdin(dataToWrite[i]);
      }
    });
  });
});

describe('spawnLineByLine::stdin/stdout', () => {
  let application = null;
  afterEach(done => exitCmd(application, done));

  it('should be able to communicate multiple times - echo', (done) => {
    application = spawnLineByLine(cmdEcho);
    let read = 0, total = 1000;
    application.stdout(line => {
      expect(line).to.equal('text' + String(read++));
      if (read === total) {
        done();
      }
    });
    for (let i=0; i<total; i++) {
      application.stdin(`text${String(i)}`);
    }
  });
});

describe('spawnByteByByte::stdin/stdout', () => {
  let application = null;
  afterEach(done => exitCmd(application, done));

  it('should be able to communicate multiple times - echo', (done) => {
    let dataToWrite = '', total = 1000;
    for (let i=0; i<total; i++) {
      dataToWrite += (String(i%10) + '\n');
    }

    let dataReceived = '';
    application = spawnByteByByte(cmdEcho);
    application.stdout(data => {
      dataReceived += String(data);
      if (dataReceived.length === dataToWrite.length) {
        expect(dataReceived).to.eql(dataToWrite);
        done();
      }
    });

    for (let i=0; i<total; i++) {
      application.stdin(String(i%10) + '\n');
    }
  });
});