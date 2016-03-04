// you have to provide your own Promise implementation if needed
import fetch from 'isomorphic-fetch';

export default (url, options = {}) => {
    const defaultOpts = {
        method: 'get',
        credentials: 'same-origin',
    };

    if (!options.upload) {
        defaultOpts.headers = {};
        defaultOpts.headers['Content-Type'] = 'application/json';
        defaultOpts.headers.Accept = 'application/json';
    }

    const opts = Object.assign({}, defaultOpts, options);

    // check status and return promise
    return fetch(url, opts).then(res => {
        const json = res.json();
        if (res.status >= 200 && res.status < 300) {
            return json;
        }
        return json.then(Promise.reject.bind(Promise));
    });
};
