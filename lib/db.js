import Promise from 'bluebird';


export default (mongoose, config) => {
    mongoose.Promise = Promise;
    if (process.env.NODE_ENV === 'test') {
        mongoose.connect('mongodb://localhost/mocha_test');
    }
    else {
        const servers = config.servers || ['localhost'];
        const replset = config.replset || null;
        mongoose.connect(servers.join(','), { replSet: { rs_name: replset } }, function(err) {
            if (err) {
                console.warn(err);
            }
            console.log('Connected to %s, %s', servers.join(', '), replset);
        });
    }
};
