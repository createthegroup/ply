/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

// The Config module provides hooks for many of the processes in Ply
// and is meant to be modified/replaced by the user.

Ply.config = (function ($) {

    return {

        // ## Core
        core: {
            // ### Error Logging URL
            // The URL to log client errors to. All JavaScript errors in
            // views are caught and logged to this URL. See `core` for more.
            errorLoggingUrl: '/error/logclienterror'
        },

        // ## Read
        read: {
            // ### URL Generator
            // If no `__url` property is found on the view, this function is called
            // with the view name to generate a URL. It is recommended that URLs have
            // some computable mapping to view names in addition to DOM selectors (see below).
            urlGenerator: function (name) {
                // #### Example
                // Replace the underscores with slashes, remove all dashes, and prefix with
                // a `/`, so `checkout_cart-modal`, would become `/checkout/cartmodal`
                return '/' + name.replace('_', '/').replace('-', '').toLowerCase();
            }
        },

        // ## UI
        ui: {
            // ### Base
            // The base object from which all views are copied. Any properties
            // created on this object will be available to every view created
            // using `Ply.ui.define`.
            base: {},
            // ### Defaults
            // The default options for each view object. When the view is started, the
            // options defined in `defaults` are merged with the options defined on
            // the `opts` property of the view, and any `options` passed in to `Ply.ui.register`.
            defaults: {},
            // ### Selector generator
            // If no `view` property is passed in to `Ply.ui.register`, the name of the view
            // is passed to this function to generate a selector which will be passed to jQuery's
            // selector engine.
            selectorGenerator: function (name) {

                var stub = name.match(/[A-Z]?[a-z]+/g).join('_').toLowerCase(),
                    controller = stub.split('_')[0];

                stub = controller + "_" + stub.substr(controller.length + 1).replace('_', '-');

                return '.view-' + stub + ', .' + stub;
            },
            // ### Register callback
            // This function is called every time `Ply.ui.register` is called. Useful as a hook for
            // changing the behavior of `register`. Note that if you return from this method,
            // `Ply.ui.start` does not called, and you can short-circuit the normal process of view
            // initialization. Use with care.
            onRegister: function (name, options) {

                // Modal view
                if (options.modal) {
                    // Overwrite options.modal so we can naively check for object properties
                    if (typeof options.modal !== 'object') {
                        options.modal = {};
                    }

                    $.modal(options.view, {
                        containerId: options.modal.containerId,
                        dataClass: options.modal.dataClass,
                        maxWidth: options.modal.maxWidth || 300,
                        maxHeight: options.modal.maxHeight,
                        updateOnOpen: options.modal.updateOnOpen,
                        onShow: function (dialog) {

                            options.view = dialog.data;

                            Ply.ui.start(name, options);

                            dialog.data.find('.modal-close').click(function (e) {
                                e.preventDefault();

                                $.modal.close();
                            });
                        }
                    });

                }

                return;
            }
        }

    };

})(jQuery);