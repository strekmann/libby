/* eslint no-param-reassign: 0 */
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';

// User model
let User = {};

function initialize(u = {}) {
    User = u;

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((userId, done) => {
        User.findById(userId, (err, user) => {
            if (err) {
                return done(err.message, null);
            }
            if (!user) {
                return done(null, false);
            }
            done(null, user);
        });
    });
}

function local(opts = { usernameField: 'email', passwordField: 'password', lowercaseUser: true }) {
    passport.passportLocal = new LocalStrategy(
        {
            usernameField: opts.usernameField,
            passwordField: opts.passwordField,
        },
        (email, password, done) => {
            if (opts.lowercaseUser) {
                email = email.toLowerCase();
            }

            User.findOne({ email }, (err, user) => {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, {
                        message: `Unknown user with email ${email}`,
                    });
                }

                user.authenticate(password, (authErr, ok) => {
                    if (authErr) { return done(authErr); }
                    if (ok) {
                        return done(null, user);
                    }
                    return done(null, false, { message: 'Could not authenticate' });
                });
            });
        }
    );
    passport.use(passport.passportLocal);
}

function google(opts = { clientID: 'clientid', clientSecret: 'clientSecret', callbackURL: 'callbackURL' }) {
    passport.use(new GoogleStrategy({
        clientID: opts.clientID,
        clientSecret: opts.clientSecret,
        callbackURL: opts.callbackURL,
    },
    (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => {
            User.findOne({ google_id: profile.id }, (err, user) => {
                if (err) {
                    return done(err.message, null);
                }
                if (user) {
                    return done(null, user);
                }
                user = new User({
                    name: profile.displayName,
                    email: profile._json.email,
                    google_id: profile.id,
                });
                user.save((saveErr) => {
                    if (saveErr) {
                        return done('Could not create user', null);
                    }
                    return done(null, user);
                });
            });
        });
    }));
}

export default passport;
export { initialize, local, google };
