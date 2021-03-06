var _ = require('underscore'),
    util = require('util'),
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

    db_name = process.env.DB_NAME || 'test',
    config = {
        sessionSecret: 'localhost',
        cookieSecret: 'hostlocal',
        uri: 'http://localhost:3000/',
        port: process.env.PORT || 3000,
        db_name: db_name,
        auth: {},
        mongo: {
            servers: ['mongodb://localhost/' + db_name],
            replset: null
        },
        redis: {},
        locales: ['en'],
        defaultLocale: 'en',
        translation_directory: path.join(__dirname, '..', '..', '..', 'public', 'js'),
        trust_proxy: false,
        session_resave: false,
        session_saveUninitialized: false,
        session_rolling: false,
        session_ttl: 86400000,
        session_name: 'connect.sid'
    };

module.exports = function(express, settings, db){
    var app = express();
    var RedisStore,
        MongoStore;

    settings = settings || {};
    config = _.extend(config, settings);

    app.conf = config;

    var sessionOpts = {
        secret: app.conf.sessionSecret,
        name: app.conf.session_name,
        resave: app.conf.session_resave,
        saveUninitialized: app.conf.session_saveUninitialized,
        rolling: app.conf.session_rolling,
        cookie: {
            maxAge: app.conf.session_ttl
        }
    };

    if (settings.trust_proxy){
        app.enable('trust proxy');
    }

    app.use(cookieParser(app.conf.cookieSecret));

    // ## Environment specific configuration
    if (app.settings.env === 'test'){
        app.use(errorHandler({
            dumpExceptions: true,
            showStack: true
        }));

        app.use(session({secret:'testing-secret', resave: config.session_resave, saveUninitialized: config.session_saveUninitialized}));
    }
    else {
        if (app.settings.env === 'development'){
            if (settings.useBunyan !== true){
                app.use(logger('dev'));

                app.use(errorHandler({
                    dumpExceptions: true,
                    showStack: true
                }));
            }
        }
        else {
            if (settings.useBunyan !== true){
                app.use(logger('combined'));
                app.use(errorHandler());
            }
        }

        if (app.conf.redis && app.conf.redis.host !== undefined && app.conf.redis.port !== undefined){
            console.info('[libby] sessions in redis %s:%s', app.conf.redis.host, app.conf.redis.port);
            RedisStore = require('connect-redis')(session);
            var storeOpts = {
                host: app.conf.redis.host,
                port: app.conf.redis.port,
                ttl: app.conf.session_ttl / 1000
            };
            if (app.conf.redis.password) {
                storeOpts.pass = app.conf.redis.password;
            }
            sessionOpts.store = new RedisStore(storeOpts);
        }
        else if (config.mongo && config.mongo.servers && db){
            console.info('[libby] sessions in mongo %s repl: %s', app.conf.mongo.servers.join(', '), app.conf.mongo.replset);
            MongoStore = require('./mongostore')(session);
            sessionOpts.store = new MongoStore(db.connection.db, {
                collectionName: 'sessions',
                ttl: app.conf.session_ttl
            });
        }
        else {
            console.info('[libby] sessions in memory.');
        }

        app.use(session(sessionOpts));
    }

    // Parses x-www-form-urlencoded request bodies (and json)
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(methodOverride());

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
        res.locals.__ = function(){
            var args = arguments;
            if (args.length === 0){ return ""; }
            args[0] = res.locals.gettext(args[0]);
            return util.format.apply(this, args);
        };
        next();
    });

    // Messages across redirects - for some reason this didn't work properly when placed higher in this file
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

    // add useful session config to app
    app.sessionConfig = {
        cookieParser: cookieParser,
        key: sessionOpts.name,
        secret: sessionOpts.secret,
        store: sessionOpts.store
    };

    return app;
};
