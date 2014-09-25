var _ = require('underscore'),
    i18n = require('i18n-abide'),
    path = require('path'),
    expressValidator = require('express-validator'),
    moment = require('moment'),
    flash = require('connect-flash'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    logger = require('morgan'),
    errorHandler = require('errorhandler'),

    config = {
        sessionSecret: 'localhost',
        cookieSecret: 'hostlocal',
        uri: 'http://localhost:3000/',
        port: process.env.PORT || 3000,
        db_name: process.env.DB_NAME || 'test',
        auth: {},
        redis: {},
        locales: ['en'],
        defaultLocale: 'en',
        translation_directory: path.join(__dirname, '..', '..', '..', 'public', 'js'),
        trust_proxy: false,
        session_rolling: false,
        session_ttl: 86400000,
        session_name: 'connect.sid'
    };

module.exports = function(express, settings){
    var app = express();
    var RedisStore;

    settings = settings || {};
    config = _.extend(config, settings);

    app.conf = config;

    if (settings.trust_proxy){
        app.enable('trust proxy');
    }

    app.use(cookieParser(app.conf.cookieSecret));

    // ## Environment specific configuration
    // Development settings
    if (app.settings.env === 'development'){
        app.use(logger('dev'));

        app.use(errorHandler({
            dumpExceptions: true,
            showStack: true
        }));

        if (config.redis.host !== undefined && config.redis.port !== undefined){
            console.info('[libby] sessions in redis %s:%s', app.conf.redis.host, app.conf.redis.port);
            RedisStore = require('connect-redis')(session);
            app.use(session({
                store: new RedisStore({
                    host: app.conf.redis.host,
                    port: app.conf.redis.port,
                    ttl: app.conf.session_ttl
                }),
                secret: app.conf.sessionSecret,
                name: config.session_name,
                resave: true,
                saveUninitialized: true,
                rolling: app.conf.session_rolling,
                cookie: {
                    maxAge: app.conf.session_ttl
                }
            }));
        }
        else {
            console.info('[libby] sessions in memory');
            app.use(session({secret:'testing-secret'}));
        }
    }

    // Test settings
    if (app.settings.env === 'test'){
        app.use(errorHandler({
            dumpExceptions: true,
            showStack: true
        }));

        app.use(session({secret:'testing-secret', resave: true, saveUninitialized: true}));
    }

    // Production settings
    if (app.settings.env === 'production'){
        app.use(logger());

        app.use(errorHandler());

        if (config.redis.host !== undefined && config.redis.port !== undefined){
            console.info('[libby] sessions in redis %s:%s', app.conf.redis.host, app.conf.redis.port);
            RedisStore = require('connect-redis')(session);
            app.use(session({
                store: new RedisStore({
                    host: app.conf.redis.host,
                    port: app.conf.redis.port,
                    ttl: app.conf.session_ttl
                }),
                secret: app.conf.sessionSecret,
                name: config.session_name,
                resave: true,
                saveUninitialized: true,
                rolling: app.conf.session_rolling,
                cookie: {
                    maxAge: app.conf.session_ttl
                }
            }));
        }
        else {
            console.info('[libby] sessions in memory in production!');
            app.use(session({secret: app.conf.sessionSecret}));
        }
    }

    // Parses x-www-form-urlencoded request bodies (and json)
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(methodOverride());

    app.use(flash());
    app.use(function(req, res, next){
        if (req.session === undefined){
            console.error('[libby] ERROR: no flash(). No session available.');
        }
        else {
            res.locals.messages = req.flash();
        }
        next();
    });

    app.use(expressValidator({
        errorFormatter: function(param, msg, value) {
            var namespace = param.split('.'),
                root = namespace.shift(),
                formParam = root;

            while(namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }
            return {
                param: formParam,
                msg: msg,
                value: value
            };
        }
    }));

    // Translation settings
    console.info('[libby] i18n-abide default: %s -- supported: %s', app.conf.defaultLocale, app.conf.locales.join(', '));
    console.info('[libby] i18n-abide translation directory: %s', app.conf.translation_directory);
    app.use(i18n.abide({
        supported_languages: app.conf.locales,
        default_lang: app.conf.defaultLocale,
        translation_directory: app.conf.translation_directory
    }));

    // Middleware setting __ translation shortcut
    app.use(function(req, res, next){
        res.locals.__ = res.locals.gettext;
        next();
    });

    return app;
};
