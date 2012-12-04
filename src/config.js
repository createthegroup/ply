/*global Ply, jQuery */
/*jshint bitwise: true, camelcase: true, curly: true, eqeqeq: true, forin: true,
immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: single,
undef: true, unused: true, strict: true, trailing: true, browser: true */

// The Config module provides hooks for many of the processes in Ply
// and is meant to be modified/replaced by the user.

Ply.config = (function ($) {

    'use strict';

    return {

        // ## Core
        core: {
            // ### Error callback
            // This function will get called for each JavaScript error. It receives
            // the exception and severity.
            onError: function (ex, sev) {

                // #### Example
                // Post the exception information including location and stack trace
                // to a logging server.
                $.post('/error/logclienterror', {
                    name: ex.name,
                    description: ex.description,
                    message: ex.message,
                    lineNumber: ex.lineNumber,
                    stackTrace: ex.stack
                });

                // If the error is fatal, inform the user.
                if (sev > 1) {
                    window.alert('An error has occurred. Please refresh your browser');
                }
            }
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
            base: {
                
                // Calling `this.refreshView()` and passing in the views html
                // response from an ajax call will automatically update the DOM
                // and re-register the view and its partials whilst persisting
                // `this.options` & `this.data`.
                refreshView: function (html) {

                    var view;

                    html = $(html);

                    this.view.replaceWith(html);

                    view = Ply.ui.register(this.name, {
                        view: html,
                        options: this.options,
                        data: this.data,
                        delegate: this.delegate
                    });

                    Ply.core.notify('view-refreshed', view);

                    return view;
                },
                
                // NOTE: The following helper elements require the scripts to be
                // included at the bottom of the page.
                window: $(window),

                document: $(document),

                html: $('html'),

                body: $('body')

            },
            // ### Defaults
            // The default options for each view object. When the view is started, the
            // options defined in `defaults` are merged with the options defined on
            // the `options` property of the view, and any `options` passed in to `Ply.ui.register`.
            defaults: {},
            // ### Selector generator
            // If no `view` property is passed in to `Ply.ui.register`, the name of the view
            // is passed to this function to generate a selector which will be passed to jQuery's
            // selector engine.
            selectorGenerator: function (name) {

                // #### Example
                // Split the name on title case, join using `_` and convert to lowercase.
                var stub = name.match(/[A-Z]?[a-z]+/g).join('_').toLowerCase(),
                    controller = stub.split('_')[0];

                // Create a "stub" which consists of the controller and action name separated
                // by an underscore.
                stub = controller + '_' + stub.substr(controller.length + 1).replace('_', '-');

                // Return a selector consisting of a class matching `stub` or of the form `.view-{stub}`.
                return '.view-' + stub + ', .' + stub;
            },
            // ### Register callback
            // This function is called every time `Ply.ui.register` is called. Useful as a hook for
            // changing the behavior of `register`. Note that if you return from this method,
            // `Ply.ui.start` does not called, and you can short-circuit the normal process of view
            // initialization. Use with care.
            onRegister: function (name, options) {

                // #### Example
                // If a truthy value (in this case, an object or `true`) is passed in for
                // options.modal.
                if (options.modal) {

                    // Make sure options.modal is an object so we can naively access
                    // properties on it.
                    options.modal = typeof options.modal === 'object' ? options.modal : {};

                    // Create a new modal view by calling $.modal (using SimpleModal in this example)
                    // and pass in the view object as the modal element.
                    $.modal(options.view, {
                        // Pass in a predefined set of accessible properties
                        // on the modal option to the plugin. Done a) to abstract
                        // out the library in use underneath, b) to limit the
                        // overridable properties of modal.
                        containerId: options.modal.containerId,
                        dataClass: options.modal.dataClass,
                        maxWidth: options.modal.maxWidth || 300,
                        maxHeight: options.modal.maxHeight,
                        updateOnOpen: options.modal.updateOnOpen,
                        onShow: function (dialog) {

                            // When the modal view is shown, rebind `options.view`
                            // which will become `this.view` on the view object to
                            // the `data` element of the modal (the modal's cotnent).
                            options.view = dialog.data;

                            // Call `Ply.ui.start` explicitly since we return out of this method.
                            Ply.ui.start(name, options);

                            // Put in modal boilerplate code, e.g. binding to close the modal.
                            dialog.data.delegate('.modal-close', 'click', function (e) {
                                e.preventDefault();

                                $.modal.close();
                            });
                        }
                    });

                }

                // Return false from this method to avoid `Ply.ui.start` getting called for us.
                return;
            }
        }

    };

// Alias `jQuery` to `$` in module's scope.
})(jQuery);