Libby - Strekmann express setup
===============================

Libby enables `trust_proxy` in express, if configured. Then sets up
a `cookieParser`, logging, error handlers and sessions. Libby will also set up
`body-parser` and `method-override` and ‘connect-flash’ to send messages to
users through `res.locals.messages`. For validation, Libby sets up
`express-validator`. Lastly, Libby sets up the translation framework
`i18n-abide` and adds a translation shortcut to `res.locals.__`.

Usage
-----

A tiny example is placed under ``examples/``. A larger example can be found at
[strekmann/node-boilerplate](/strekmann/node-boilerplate).

Setup
-----

Libby takes three parameters, where only the first is required.

```
var libby = require(‘libby’);
…

var app = libby(express, settings, db);
```

* `express` is an express instance.
* `settings` is an object containing configuration.
* `db` is only used when `mongo` has been configured as the session storage.

Options
-------

### sessionSecret

The string containing the secret used in _express-session_.

### session_name

The name used for the session cookie in _express-session_. Default
`connect.sid`.

### session_ttl

The _time to live_ for sessions (in milliseconds). Default `86400000`.

### session_rolling

If true, will update the session expiration date. Default `false`.

### session_resave

Forces the sessions to be saved back to the session store, even if the session
was never modified during the request. (From express-session.) Default `false`.

### session_saveUnitialized

Forces a session that is “uninitialized” to be saved to the session store.
(From express-session.) Default `false`.

### cookieSecret

The string containing the secret used with `cookie-parser`.

### port

Port number your app will use. Default: the contents of PORT environment variable, with `3000` as fallback.

### db_name

The mongodb database to connect to. Default: the contents of DB_NAME
environment variable, with `test` as fallback.

### mongo

Setup the connection to mongodb. The default is:

```
mongo: {
    servers: [‘mongodb://localhost/’ + db_name],
    replset: null
}
```

### redis

Setup the connection for redis (recommended for sessions). The default is:

```
redis: {
    host: ‘127.0.0.1’,
    port: 6379
}
```

### trust_proxy

If express should trust `X-Forwarded-*` headers. Default `false`.

### locales

List of supported locales to use with _i18n-abide_ localization framework.
Default `[‘en’]`.

### defaultLocale

The default locale to use. Should be defined in the list above. Default `’en’`.

### translationDirectory

Path to locales dir for translations.

### useBunyan

Enables Bunyan logging when set to `true`.
