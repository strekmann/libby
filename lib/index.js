export { default as connectDB } from './db';
export { default as fetch } from './fetch';
export { default as redis } from './redisclient';

export * from './middleware';

//import { logger } from './logger';
//export { logger };

export {
    logger,
    defaultSerializers,
    configure as configureLogger,
} from './logger';

export {
    initialize as initializePassport,
    local as localPassport,
    google as googlePassport,
    passport,
} from './passport';
