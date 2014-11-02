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

ajax.send = function (url, callback, method, data, responseType, async) {
    var xhr = ajax.x();

    xhr.open(method, url, async);

    if (async)
        xhr.responseType = responseType || "json";

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
    //url, data, callback, responseType, async
    var query = [];

    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }

    if (query.length > 0)
        url = url + '?' + query.join('&');

    ajax.send(url, callback, 'GET', null, responseType, async);
};

ajax.post = function (url, data, callback, responseType, async) {
    var query = [];

    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }

    ajax.send(url, callback, 'POST', query.join('&'), responseType, async);
};

//-----------------------------------------------------------------

module.exports = {
    get: ajax.get,
    post: ajax.post
};
