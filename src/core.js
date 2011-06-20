/*global jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

var Ply = {};

Ply.core = (function () {

    var listeners = {},
        debug     = false;

    return {

        notify: function (note, sender, data) {

            if (!listeners[note]) {
                listeners[note] = [];
            }

            for (var i = 0, l = listeners[note].length; i < l; i++) {
                listeners[note][i].handler.apply(listeners[note][i].listener, [note, sender, data]);
            }

            return;
        },

        listen: function (notification, handler, listener) {

            var notes = notification.split(/\s/),
                i     = 0,
                len   = notes.length;

            if (notes.length > 1) {
                for (; i < len; i++) {
                    this.listen(notes[i], handler, listener);
                }

                return;
            }

            if (!listeners[notification]) {
                listeners[notification] = [];
            }

            listeners[notification].push({
                handler: handler,
                listener: listener
            });

            return;
        },

        log: function (msg, type) {

            if (!debug) {
                return;
            }

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

            return;
        },

        error: function (ex, sev) {

            jQuery.post(Ply.config.core.errorLoggingUrl, {
                name: ex.name,
                description: ex.description,
                message: ex.message,
                lineNumber: ex.lineNumber,
                stackTrace: ex.stack
            });

            if (sev > 1) {
                // if error is fatal, inform the user
                alert('An error has occurred. Please refresh your browser');
            }

            return;
        },

        debug: function (val) {

            debug = val || true;

            if (debug) {
                this.log('debugging...', 'info');
                this.debugOn = true;
            }

        },

        debugOn: function () {
            return !!debug;
        }()

    };

})();