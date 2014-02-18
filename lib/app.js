var    _ = require('underscore'),
    i18n = require('i18n'),
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
        i18n: {
            locales: ['en'],
            defaultLocale: 'en'
        }
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
        app.use(express.logger({
            format: 'tiny'
        }));

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

    // Translation settings
    i18n.configure({
        locales: app.conf.i18n.locales,
        defaultLocale: app.conf.i18n.defaultLocale,
        cookie: 'locale',
        directory: path.join(__dirname, "..", "locales"),
        extension: '.js',
        indent: "    ",
        updateFiles: false
    });

    app.i18n = i18n;

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

        app.use(app.i18n.init);
        app.use(function (req, res, next) {
            app.i18n.setLocale(app.i18n.getLocale(req));
            return next();
        });

        // Middleware setting moment language
        app.use(function(req, res, next){
            moment.lang(req.locale);
            next();
        });
    });

    return app;
};
