/*global jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

// Declare global namespace and assign version number.

var Ply = {
    VERSION: '0.1.0'
};

// Define `core` module.

Ply.core = (function ($) {

    // Create private variables. Listeners is an associative array holding arrays of
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
        listen: function (notification, handler, listener) {

            // Cache the listeners
            var list  = listeners[notification],
                // Split the notification on whitespace.
                notes = notification.split(/\s/),
                // Create loop variables.
                len   = notes.length,
                i     = 0;

            // If the notification name is separated by whitespace,
            // listen on each particular notification.
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

            // Add listener to the list with handler function.
            list.push({
                handler: handler,
                listener: listener
            });

        },

        // Lightweight logging wrapper around console.log. Useful less so
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

// Alias `jQuery` in module scope.
})(jQuery);