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

handler({k1: 'v1'}, makeContext(null, JSON.stringify({event: {k1: 'v1'}, context: {}})));
handler({k2: 'v2'}, makeContext(null, JSON.stringify({event: {k2: 'v2'}, context: {}})));
handler({k3: 'v3'}, makeContext(null, JSON.stringify({event: {k3: 'v3'}, context: {}})));

process.exit(0);