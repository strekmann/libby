// you have to provide your own Promise implementation if needed
import fetch from 'isomorphic-fetch';

let base = '';

export function setBase(value) {
    base = value;
}

export default (url, options) => {
    const opts = Object.assign({}, {
        method: 'get',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    }, options);

    // some routes should be allowed at root, but default should be to
    // use api + version
    let baseurl = base;
    if (!opts.root) {
        baseurl += '/api/1';
    }

    if (!url.match(/^https?:/)) {
        url = baseurl + url;
    }

    // check status and return promise
    return fetch(url, opts).then(res => {
        const json = res.json();
        if (res.status >= 200 && res.status < 300) {
            return json;
        }
        return json.then(Promise.reject.bind(Promise));
    });
};
