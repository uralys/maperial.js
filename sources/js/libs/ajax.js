//-----------------------------------------------------------------

var ajax = {};

//-----------------------------------------------------------------
/*
    readyState : Holds the status of the XMLHttpRequest. Changes from 0 to 4:
        0: request not initialized
        1: server connection established
        2: request received
        3: processing request
        4: request finished and response is ready

    status
        200: "OK"
        404: Page not found
 */

ajax.RESPONSE_READY = 4;
ajax.STATUS_OK = 200;

//-----------------------------------------------------------------

ajax.x = function () {
    if (typeof XMLHttpRequest !== 'undefined') {
        return new XMLHttpRequest();
    }
    var versions = [
        "MSXML2.XmlHttp.5.0",
        "MSXML2.XmlHttp.4.0",
        "MSXML2.XmlHttp.3.0",
        "MSXML2.XmlHttp.2.0",
        "Microsoft.XmlHttp"
    ];

    var xhr = null;

    for (var i = 0; i < versions.length; i++) {
        try {
            xhr = new ActiveXObject(versions[i]);
            break;
        } catch (e) {}
    }
    return xhr;
};

ajax.send = function (url, callback, method, data, dataType, responseType, async) {
    var xhr = ajax.x();

    xhr.open(method, url, async);

    if (async) {
        xhr.responseType = responseType || "json";
    }

    xhr.dataType = dataType || 'json';

    xhr.onreadystatechange = function () {
        if (xhr.readyState == ajax.RESPONSE_READY) {
            if (xhr.status === ajax.STATUS_OK) {
                var response;

                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    response = xhr.response;
                }

                callback(response.error, response);
            } else
                callback(true, null);
        }
    };

    if (method == 'POST') {
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }

    xhr.send(data);
};

//-----------------------------------------------------------------

ajax.get = function (options, callback) {
    var query = [];

    for (var key in options.data) {
        query.push(
            encodeURIComponent(key) + '=' +
            encodeURIComponent(options.data[key])
        );
    }

    if (query.length > 0)
        options.url = options.url + '?' + query.join('&');

    ajax.send(
        options.url,
        options.callback,
        'GET',
        null,
        options.dataType,
        options.responseType,
        options.async
    );
};

ajax.post = function (options, callback) {
    var query = [];

    for (var key in options.data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(options.data[key]));
    }

    ajax.send(
        options.url,
        options.callback,
        'POST',
        query.join('&'),
        options.dataType,
        options.responseType,
        options.async
    );
};

//-----------------------------------------------------------------

module.exports = {
    get: ajax.get,
    post: ajax.post
};
