/* eslint "no-console": 0 */

import util from 'util';
import _ from 'lodash';
import bunyan from 'bunyan';

// default serializers configuration
const defaultSerializers = {
    res: (res) => {
        if (!_.isObject(res)) { return res; }
        return {
            statusCode: res.statusCode,
            header: res._header,
        };
    },
    req: (req) => {
        const connection = req.connection || {};

        if (!_.isObject(req)) { return req; }

        return {
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAdress: connection.remoteAddress,
            remotePort: connection.remotePort,
        };
    },
};

let logger = console;
logger.fatal = logger.error;

// create default bunyan logger if not in test environment
if (process.env.NODE_ENV !== 'test') {
    logger = bunyan.createLogger({ name: 'libby' });
}

// Clients may use configure option to configure
// the bunyan logger
function configure(opts = { name: 'libby' }) {
    if (process.env.NODE_ENV !== 'test') {
        logger = bunyan.createLogger(opts);

        const consoleLog = logger.child({ console: true });
        console.log = function log() {
            consoleLog.debug(null, util.format.apply(this, arguments));
        };
        console.debug = function debug() {
            consoleLog.debug(null, util.format.apply(this, arguments));
        };
        console.info = function info() {
            consoleLog.info(null, util.format.apply(this, arguments));
        };
        console.warn = function warn() {
            consoleLog.warn(null, util.format.apply(this, arguments));
        };
        console.error = function error() {
            consoleLog.error(null, util.format.apply(this, arguments));
        };
    }
}

export default logger;
export { defaultSerializers, configure };
