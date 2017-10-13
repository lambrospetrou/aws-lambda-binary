const handler = require('./wrapper').handler;

let i=0;
const makeContext = (expErr, expResult) => {
    i++;
    return {
        done: (err, result) => {
            i--;
            if (err !== expErr) {
                console.error(`Got >${err}<, expected >${expErr}<`);
            }
            if (String(result) !== String(expResult)) {
                console.error(`Got >${result}<, expected >${expResult}<`);
            }
        }
    };
}

handler({k1: 'v1'}, makeContext(null, JSON.stringify({k1: 'v1'})));

const check = () => {
    if (i === 0) {
        process.exit(0);
    } else {
        setTimeout(check, 100);
    }
};
check();