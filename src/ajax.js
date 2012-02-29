/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

// The Ajax module is a simple wrapper around jQuery's `ajax` method.
// The goal is to provide an abstracted API, allowing us to switch out the implementation
// underneath. Since all Ajax requests go through this mechanism, we can catch all Ajax errors
// and log them in one place, as well as do things like modify the data that is sent to the server.

// Define the `ajax` module.
Ply.ajax = (function ($) {

    return {

        request: function (request, success, failure) {

            // Create alias for request to avoid reference errors.
            var r    = request || {},
                // Default to `GET` request if no type is explicitly given.
                type = r.type  || "GET",
                url  = r.url   || '',
                data = r.data  || {},
                cache = typeof r.cache === 'undefined' ? true : r.cache;

            // Send along a `debug` parameter on all requests
            // if debug mode is enabled.
            if (Ply.core.debugOn) {
                data.debug = true;
            }

            // Surround ajax request in a try/catch block to catch any possible errors.
            try {
                // We return the result of calling `$.ajax`, an XHR object, so clients
                // can call XHR methods on the object, e.g. `abort()`.
                return $.ajax({
                    type: type,
                    url: url,
                    data: data,
                    success: function (response, status, xhr) {

                        // Call the `success` callback with the response.
                        if (success && typeof success === 'function') {
                            success(response, status, xhr);
                        }

                    },
                    error: function (xhr, status, error) {

                        // On error, log an AjaxError to the the `console`.
                        Ply.core.log('AjaxError: ' + status + ' - ' + url, 'warn');

                        // Call the `error` method on the core module. Will post the error data
                        // to the logging server.
                        Ply.core.error({
                            name: 'AjaxError',
                            // Send the status code in the message.
                            message: 'Status: ' + status,
                            description: 'URL: ' + url
                        }, 1);

                        // Call the `failure` callback function if one is provided.
                        if (failure && typeof failure === 'function') {
                            failure(xhr, status, error);
                        }

                    }
                });
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