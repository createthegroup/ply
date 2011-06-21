/*global jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

// **Ply** is a lightweight JavaScript framework for creating
// reusable UI components and managing application logic. It
// aims to eliminate boilerplate code, create a consistent interface,
// and provide common patterns for code organization and re-use.

// Ply is not an MVC framework and doesn't aim to compete
// with [Backbone.js](http://documentcloud.github.com/backbone/) or [SproutCore](http://www.sproutcore.com/). Instead, it is intended for users
// who need to maintain logic on the server and are looking for a better
// option for code re-use and organization.

// This file comprises the Core module.

// Declare global namespace and assign version number.

var Ply = {
    VERSION: '0.1.1'
};

// Define `core` module.

Ply.core = (function ($) {

    // Create private variables. `listeners` is an associative array holding arrays of
    // notification listeners keyed on the notification name.
    var listeners = {},
        debug     = false;

    return {

        // Notifies listeners of an event. Notifiers should send themselves
        // and optional data as arguments.
        notify: function (note, sender, data) {

            // Cache listeners array.
            var list = listeners[note],
                // Create loop variables.
                i    = 0,
                len  = list.length;

            // Create an empty array of listeners if none exists.
            if (!list) {
                listeners[note] = [];
            }

            // Loop over listeners and notify each.
            for (; i < len; i++) {
                list[i].handler.apply(list[i].listener, [note, sender, data]);
            }

        },

        // Listens for a particular notification or set of notifications.
        // Clients should pass in a handler function and themselves as arguments.
        // When the handler function is called, it will be applied to the `listener`'s
        // scope, ensuring that `this` refers to what the client expects.
        listen: function (notification, handler, listener) {

            // Cache the notification's listeners.
            var list  = listeners[notification],
                // Split the notification on whitespace. Clients can listen to
                // multiple notifications by passing in a string with the notification
                // names split by whitespace.
                notes = notification.split(/\s/),
                // Create loop variables.
                len   = notes.length,
                i     = 0;

            // If the notification name contains whitespace,
            // listen on each particular notification (segment).
            if (len > 1) {
                for (; i < len; i++) {
                    this.listen(notes[i], handler, listener);
                }

                return;
            }

            // If there is no listeners array for the notification,
            // create a new one.
            if (!list) {
                listeners[notification] = [];
            }

            // Add the listener and handler function to the notifications array.
            list.push({
                handler: handler,
                listener: listener
            });

        },

        // Lightweight logging wrapper around `console`. Useful less so
        // for debugging than for posting notices of interest.
        log: function (msg, type) {

            // Do nothing if debug mode is disabled.
            if (!debug) {
                return;
            }

            // Use the correct logging mechanism based
            // on the parameter type.
            if (window.console) {

                switch (type) {
                case 'warn':
                    console.warn(msg);
                    break;

                case 'info':
                    console.info(msg);
                    break;

                default:
                    console.log(msg);
                    break;
                }
            }

        },

        // Error handler to catch all JavaScript errors. We post
        // all error names along with their stack trace and description
        // to a url provided by the client. Configure the URL in `Ply.config.coreerrorLoggingUrl`.
        error: function (ex, sev) {

            $.post(Ply.config.core.errorLoggingUrl, {
                name: ex.name,
                description: ex.description,
                message: ex.message,
                lineNumber: ex.lineNumber,
                stackTrace: ex.stack
            });

            // Inform the user if error is fatal.
            if (sev > 1) {
                alert('An error has occurred. Please refresh your browser');
            }

        },

        // Enabled debugging when called with no argues or with any truthy value. To disable debug mode
        // send `false` or another falsy value to this function, e.g.: `Ply.core.debug(0)`.
        debug: function (val) {

            // Default to `true` if no arguments.
            debug = val || true;

            if (debug) {
                // Print debug notice.
                this.log('debugging...', 'info');

                // Manually set `this.debugOn` in case debug is set after Ply has been initialized.
                // `debugOn` will still be cached to the old value.
                this.debugOn = true;
            }

            // Do the opposite.
            this.debugOn = false;
        },

        // Cache the value of debug. This is used by clients to determine
        // if debug mode is currently enabled.
        debugOn: function () {
            // Coerce the value to a boolean.
            return !!debug;
        }()

    };

// Alias `jQuery` to `$` in module scope.
})(jQuery);

// Read about the [Ajax](ajax.html) module next.