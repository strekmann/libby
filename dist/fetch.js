'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setBase = setBase;

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var base = ''; // you have to provide your own Promise implementation if needed


function setBase(value) {
    base = value;
}

exports.default = function (url, options) {
    var opts = Object.assign({}, {
        method: 'get',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }, options);

    // some routes should be allowed at root, but default should be to
    // use api + version
    var baseurl = base;
    if (!opts.root) {
        baseurl += '/api/1';
    }

    if (!url.match(/^https?:/)) {
        url = baseurl + url;
    }

    // check status and return promise
    return (0, _isomorphicFetch2.default)(url, opts).then(function (res) {
        var json = res.json();
        if (res.status >= 200 && res.status < 300) {
            return json;
        }
        return json.then(Promise.reject.bind(Promise));
    });
};