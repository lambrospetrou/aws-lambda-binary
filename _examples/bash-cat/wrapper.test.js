const handler = require('./wrapper').handler;

const makeContext = (expErr, expResult) => ({
    done: (err, result) => {
        if (err !== expErr) {
            console.error(`Got ${err}, expected ${expErr}`);
        }
        if (result !== expResult) {
            console.error(`Got ${result}, expected ${expResult}`);
        }
    }
});

handler({k1: 'v1'}, makeContext(null, JSON.stringify({k1: 'v1'})));
handler({k2: 'v2'}, makeContext(null, JSON.stringify({k2: 'v2'})));
handler({k3: 'v3'}, makeContext(null, JSON.stringify({k3: 'v3'})));

process.exit(0);