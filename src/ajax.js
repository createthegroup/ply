/*global Ply, jQuery */
/*jshint bitwise: true, camelcase: true, curly: true, eqeqeq: true, forin: true,
immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: single,
undef: true, unused: true, strict: true, trailing: true, browser: true */

// The Ajax module is a simple wrapper around jQuery's `ajax` method which allows us to
// catch all Ajax errors and log them in one place, extend the data sent to the server and
// extend the API.

// As you might expect the API supports all [jQuery.ajax options](http://api.jquery.com/jQuery.ajax/).

// By default multiple calls to `Ply.ajax.request` from within the *same* call stack will automatically have
// their `success` or `error` and `complete` callbacks synchronized. This allows DOM updates performed by callbacks
// from separate requests to occur at the same time regardless of the response time. This functionality can be
// switched off by passing `independent: true` into the options.

// Define the `ajax` module.
Ply.ajax = (function ($) {

    'use strict';

    // ## Private Variables
    
    var requests = [];

    // ## Public Methods & Properties

    return {
        
        request: function (url, options) {

            var request = {
                    promise: null,
                    success: null,
                    error: null,
                    complete: null
                },
                _error;

            // support jQuery 1.0 and 1.5+ signature
            if (typeof url === 'object') {
                options = url;
            }
            else {
                $.extend(options, {
                    url: url
                });
            }

            // Send along a `debug` parameter on all requests
            // if debug mode is enabled.
            if (Ply.core.debugOn) {
                $.extend(options.data, {
                    debug: true
                });
            }

            // Augment error callback to facilitate error logging.
            _error = options.error;
            options.error = function (jqXHR, textStatus, errorThrown) {

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

                // Call the `error` callback function if one is provided.
                if (typeof _error === 'function') {
                    _error(jqXHR, textStatus, errorThrown);
                }

            };

            // Remove the `success`, `error` and `complete` callbacks from the
            // options object as they'll be added to the promise after the ajax
            // request is made.
            if (!options.independent) {
                request.success = options.success;
                request.error = options.error;
                request.complete = options.complete;
                delete options.success;
                delete options.error;
                delete options.complete;
            }

            // Surround ajax request in a try/catch block to catch any possible errors.
            try {
                // We return the result of calling `$.ajax`, an jqXHR object, so clients
                // can call XHR methods on the object, e.g. `abort()`.
                request.promise = $.ajax(options);
            }
            // Log and post any error that may have occurred.
            catch (ex) {
                Ply.core.log(ex.message);
                Ply.core.error(ex, 1);
            }

            if (!options.inependent) {
                // Add `request` to `requests` array.
                requests.push(request);

                // `$.when` only needs to be run once per call stack.
                if (requests.length === 1) {
                    // `setTimeout` is used to move `$.when` to new call stack allowing multiple
                    // `Ply.ajax.request` calls within the same stack to be synchronized.
                    setTimeout(function () {

                        $.when.apply($, $.map(requests, function (request) {
                            return request.promise;
                        }))
                        .always(function () {
                            
                            // Iterate over the `requests` array and add the `success`, `error` and `complete`
                            // callbacks to the appropriate promise.
                            for (var i = 0, len = requests.length; i < len; i++) {
                                requests[i].promise
                                    .done(requests[i].success)
                                    .fail(requests[i].error)
                                    .always(requests[i].complete);
                            }

                            // reset `requests` array ready for new call stack.
                            requests = [];

                        });

                    }, 0);
                }
            }

            return request.promise;
        }

    };

// Alias `jQuery` to `$` for the module's scope.
})(jQuery);

// &#8618; [Read](read.html)