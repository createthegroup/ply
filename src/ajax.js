/* global Ply, jQuery */
/* jshint bitwise: true, camelcase: true, curly: true, eqeqeq: true, forin: true,
immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: "single",
undef: true, unused: true, strict: true, trailing: true */

// The Ajax module is a simple wrapper around jQuery's `ajax` method which allows us to
// catch all Ajax errors and log them in one place, extend the data sent to the server and
// extend the API.

// As you might expect the API supports all [jQuery.fn.ajax options](http://api.jquery.com/jQuery.ajax/) but also
// provides an extra option `deferred` which allows a [jQuery.Deferred](http://api.jquery.com/category/deferred-object/)
// object to be passed in to synchronize callbacks from multiple ajax requests.
//
// e.g.
//
// var deferred = new $.Deferred();
//
// Ply.ajax.request({
//     deferred: deferred,
//     url: '/foo',
//     success: function () {
//         console.log('foo success');
//     },
//     error: function () {
//         console.log('foo error');
//     }
// });
//
// Ply.ajax.request({
//     deferred: deferred,
//     url: '/bar',
//     success: function () {
//         console.log('bar success');
//     },
//     error: function () {
//         console.log('bar error');
//     }
// });
//
// The above example would log out `foo success` and `bar success` once *both* requests have
// successfully returned. If one or more requests were to fail then it should be noted that
// the error callbacks will be fired for all requests using that deferred object.

// Define the `ajax` module.
Ply.ajax = (function ($) {

    'use strict';

    // ## Utility methods

    // ### Polyfills

    // Create a polyfill for `Array.prototype.indexOf` so we can use it
    // natively when removing deferreds from deferreds array.

    // Source code from: [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf).

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    // ## Private Variables
    
    var guid = 0,
        deferreds = [];

    // ## Public Methods & Properties

    return {
        
        request: function (url, options) {

            // support jQuery 1.0 and 1.5+ signature
            if (typeof url === 'object') {
                options = url;
            }
            else {
                options = options || {};
                options.url = url;
            }
        
            var self = this,
                // Used to map `success`, `error` and `complete` callback
                // arguments with this request.
                requestId = guid++,
                deferred = options.deferred || new $.Deferred(),
                success = options.success || $.noop,
                error = options.error || $.noop,
                complete = options.complete || $.noop;

            // Send along a `debug` parameter on all requests
            // if debug mode is enabled.
            if (Ply.core.debugOn) {
                $.extend(options.data, {
                    debug: true
                });
            }
            
            // If deferred isn't already in deferreds array push to array and extend deferred
            // with `requestCount`, `responseCount`, `args` and `result` properties.
            if ($.inArray(deferred, deferreds) === -1) {
                deferreds.push(deferred);
                $.extend(deferred, {
                    data: {
                        requestCount: 0,
                        responseCount: 0,
                        // Used to store success, error and callbacks arguments.
                        args: {},
                        // Determines whether deferred is resolved or rejected.
                        result: 'resolve'
                    }
                });
            }
            
            // Always increment `requestCount` on deferred object.
            deferred.data.requestCount++;
            // Define property to store arguments for current requests response callbacks on deferred's args obj.
            deferred.data.args[requestId] = {};

            // Add the `success`, `error` and `complete` callbacks to the deferred obj.
            deferred
                .done(function () {
                    success.apply(this, deferred.data.args[requestId].success);
                })
                .fail(function () {
                    error.apply(this, deferred.data.args[requestId].error);
                })
                .always(function () {
                    complete.apply(this, deferred.data.args[requestId].complete);
                });
            
            // Surround ajax request in a try/catch block to catch any possible errors.
            try {
                // We return the result of calling `$.ajax`, an XHR object, so clients
                // can call XHR methods on the object, e.g. `abort()`.
                return $.ajax($.extend(options, {
                    success: function (data, textStatus, jqXHR) {

                        // Store arguments on deferred's args property to later map to success callback.
                        deferred.data.args[requestId].success = [data, textStatus, jqXHR];
                        
                        // Even though the request was successful error arguments must be defined in case
                        // another request on the deferred object fails causing the deferred to be rejected.
                        deferred.data.args[requestId].error = [jqXHR, textStatus, 'Ply.ajax - Deferred Rejected'];

                    },
                    error: function (jqXHR, textStatus, errorThrown) {

                        // Store arguments on deferred's args property to later map to error callback.
                        deferred.data.args[requestId].error = [jqXHR, textStatus, errorThrown];

                        // A request on the deferred has failed so we need to set the result to rejected.
                        deferred.data.result = 'reject';

                        // On error, log an AjaxError to the the `console`.
                        Ply.core.log('AjaxError: ' + textStatus + ' - ' + options.url, 'warn');

                        // Call the `error` method on the core module. Will post the error data
                        // to the logging server.
                        Ply.core.error({
                            name: 'AjaxError',
                            // Send the status code in the message.
                            message: 'Status: ' + textStatus,
                            description: 'URL: ' + options.url
                        }, 1);

                    },
                    complete: function (jqXHR, textStatus) {

                        // The complete callback is always run so increment `responseCount`.
                        deferred.data.responseCount++;
                        
                        // Store arguments on deferred's args property to later map to complete callback.
                        deferred.data.args[requestId].complete = [jqXHR, textStatus];

                        // When responseCount matches the requestCount the deferred should be resolved.
                        if (deferred.data.responseCount === deferred.data.requestCount) {
                            deferred[deferred.data.result + 'With'](this);
                            deferreds.splice(deferreds.indexOf(deferred), 1);
                        }

                    }
                }));
            }
            // Log and post any error that may have occurred.
            catch (ex) {
                Ply.core.log(ex.message);
                Ply.core.error(ex, 1);
            }

        }

    };

// Alias `jQuery` to `$` for the module's scope.
})(jQuery);

// &#8618; [Read](read.html)