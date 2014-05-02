var _ = require('underscore'),
    i18n = require('i18n-abide'),
    path = require('path'),
    expressValidator = require('express-validator'),
    moment = require('moment'),
    flash = require('connect-flash'),

    config = {
        siteName: 'localhost',
        sessionSecret: 'localhost',
        uri: 'http://localhost:3000/',
        port: process.env.PORT || 3000,
        db_name: process.env.DB_NAME || 'test',
        auth: {},
        redis: {},
        languages: ['en'],
        default_language: 'en',
        translation_directory: '../../public/js'
    };

module.exports = function(express, settings){
    var app = express();

    settings = settings || {};
    config = _.extend(config, settings);

    app.conf = config;

    app.configure(function(){
        app.use(express.cookieParser());
    });

    // ## Environment specific configuration
    // Development settings
    app.configure('development', function(){
        app.use(express.logger('dev'));

        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));

        if (config.redis.host !== undefined && config.redis.port !== undefined){
            var RedisStore = require('connect-redis')(express);
            app.use(express.session({
                store: new RedisStore({
                    host: app.conf.redis.host,
                    port: app.conf.redis.port
                }),
                secret: app.conf.sessionSecret
            }));
        }
        else {
            app.use(express.session({secret:'testing-secret'}));
        }
    });

    // Test settings
    app.configure('test', function(){
        app.use(express.logger('dev'));

        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));

        app.use(express.session({secret:'testing-secret'}));
    });

    // Production settings
    app.configure('production', function(){
        app.use(express.logger());

        app.use(express.errorHandler());

        if (config.redis.host !== undefined && config.redis.port !== undefined){
            var RedisStore = require('connect-redis')(express);
            app.use(express.session({
                store: new RedisStore({
                    host: app.conf.redis.host,
                    port: app.conf.redis.port
                }),
                secret: app.conf.sessionSecret
            }));
        }
        else {
            app.use(express.session({secret:'testing-secret'}));
        }
    });

    app.configure(function(){
        app.use(flash());
        app.use(function(req, res, next){
            res.locals.messages = req.flash();
            next();
        });

        // Parses x-www-form-urlencoded request bodies (and json)
        app.use(express.urlencoded());
        app.use(express.json());
        app.use(express.methodOverride());

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
        app.use(i18n.abide({
            supported_languages: app.conf.languages,
            default_lang: app.conf.default_language,
            translation_directory: app.conf.translation_directory
        }));

        // Middleware setting moment language and __ translation shortcut
        app.use(function(req, res, next){
            res.locals.__ = res.locals.gettext;
            next();
        });

    });

    return app;
};
