Libby - Strekmann libraries
===========================

If you are looking for the express setup version of libby, check out the 2.x
branch.

Libby 3.x
---------

Libby is no longer used for express setup and configuration. It is now a
collection of libraries we have ended up using a lot.

Database connection
-------------------

Connect to MongoDB using mongoose. We replace default MongoDB promises with Bluebird.

```javascript
import { connectDB } from 'libby';
connectDB(mongoose, config);
```

Where `mongoose` is your mongoose instance and `config` is an object;
```javascript
{
  servers: ['mongodb://server1/somedb', 'mongodb://server2/somedb'],
  replset: 'rs0'
}
```

Middleware
----------

### ensureAuthenticated

```javascript
import { ensureAuthenticated } from 'libby'
app.use('/', ensureAuthenticated, someRouter);
```

Checks req.isAuthenticated() and returns 403 if not.

Logger
------

Logging with bunyan. Adds a child logger with `console: true` for console.debug|log|info|warn|error.
If `NODE_ENV` is test console is used.

```javascript
import { configureLogger, logger, defaultSerializers } from 'libby';

const opts = {
  name: 'my-app',
  serializers: defaultSerializers
};

configureLogger(opts);

logger.info('Hello world ...');
```

When using `express-bunyan-logger` you can pass in the logger object as logger option to use the same bunyan logger.

Passport
--------

Configuring passport for use with local or google oauth.

```javascript
import { initializePassport, localPassport, passport } from 'libby';
import { User } from './models';

initializePassport(User);
localPassport();

app.use(passport.initialize());
app.use(passport.session());
```

Initialize passport with your User model.

localPassport(opts) configures passport-local with opts.
```javascript
{
  usernameField: 'email',
  passwordField: 'password',
  lowercaseUser: true
}
```
Is the default options.

googlePassport(opts) configures passport-google-oauth with opts.
```javascript
{
  clientID: 'google-client-id',
  clientSecret: 'google-client-secret',
  callbackURL: '/auth/google/callback'
}
```

User model is expected to have `google_id`, `name` and `email` fields which will be populated with data from google.
