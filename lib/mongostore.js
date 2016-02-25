import util from 'util';
import { MongoClient } from 'mongodb';

/**
 * Return the `MongoStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */
export default function (connect) {
    const store = connect.Store || connect.session.Store;
    /**
     * Initialize a new `MongoStore`.
     *
     * @api public
     */
    function MongoStore(uri, options) {
        const self = this;

        this.options = options || (options = {});
        options.collectionName = options.collectionName || 'sessions';
        // 1 day
        options.ttl = options.ttl || 24 * 60 * 60 * 1000;
        // 60 s
        options.cleanupInterval = options.cleanupInterval || 60 * 1000;
        options.server = options.server || {};
        options.server.auto_reconnect = !options.server.auto_reconnect ? options.server.auto_reconnect : true;

        this._error = function (err) {
            if (err) { self.emit('error', err); }
        };

        // It's a Db instance.
        if (uri.collection) {
            this.db = uri;
            this._setup();
        }
        else {
            MongoClient.connect(uri, options, (err, db) => {
                if (err) { return self._error(err); }
                self.db = db;
                self._setup();
            });
        }
    }

    util.inherits(MongoStore, store);

    /**
     * Attempt to fetch session by the given `id`.
     *
     * @param {String} id
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.get = function (id, callback) {
        this.collection.findOne({ _id: id }, (err, doc) => {
            callback(err, doc ? doc.sess : null);
        });
    };

    /**
     * Commit the given `sess` object associated with the given `id`.
     *
     * @param {String} id
     * @param {Session} sess
     * @param {Function} [callback]
     * @api public
     */
    MongoStore.prototype.set = function (id, sess, callback) {
        let expires;

        if (sess && sess.cookie && sess.cookie.expires) {
            expires = Date.parse(sess.cookie.expires);
        }
        else {
            expires = Date.now() + this.options.ttl;
        }

        this.collection.update(
            { _id: id },
            { $set: {
                sess,
                expires,
            }, },
            { upsert: true },
            callback || this._error
        );
    };

    /**
     * Destroy the session associated with the given `id`.
     *
     * @param {String} id
     * @param {Function} [callback]
     * @api public
     */
    MongoStore.prototype.destroy = function (id, callback) {
        this.collection.remove({ _id: id }, callback || this._error);
    };

    /**
     * Invoke the given callback `callback` with all active sessions.
     *
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.all = function (callback) {
        this.collection.find().toArray((err, docs) => {
            const sess = [];
            if (err) { return callback(err); }
            docs.forEach((doc) => {
                sess.push(doc.sess);
            });
            callback(null, sess);
        });
    };

    /**
     * Clear all sessions.
     *
     * @param {Function} [callback]
     * @api public
     */
    MongoStore.prototype.clear = function (callback) {
        this.collection.remove({}, callback || this._error);
    };

    /**
     * Fetch number of sessions.
     *
     * @param {Function} callback
     * @api public
     */
    MongoStore.prototype.length = function (callback) {
        this.collection.count({}, callback);
    };

    /**
     * Setup collection, cleanup, error handler.
     */
    MongoStore.prototype._setup = function () {
        const self = this;

        this.db
            .on('error', this._error)
            .collection(
                this.options.collectionName,
                (err, collection) => {
                    if (err) { return self._error(err); }
                    self.collection = collection;
                    setInterval(() => {
                        collection.remove({ expires: { $lt: Date.now() } }, self._error);
                    }, self.options.cleanupInterval);
                    self.emit('connect');
                }
            );
    };

    return MongoStore;
}
