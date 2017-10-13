const handler = require('./wrapper').handler;

const context = {
    done: (err, result) => {
        if (err) {
            console.error(err);
        }
        console.info(JSON.stringify(result));
    }
};

handler({k1: 'v1'}, context);
handler({k2: 'v1'}, context);
handler({k3: 'v1'}, context);
handler({k4: 'v1'}, context);
handler({k5: 'v1'}, context);

process.exit(0);