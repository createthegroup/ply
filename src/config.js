/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

Ply.config = (function ($) {

    return {

        core: {
            errorLoggingUrl: '/error/logclienterror'
        },

        read: {
            urlGenerator: function (name) {
                return '/' + name.split('_').join('/').replace('-', '').toLowerCase();
            }
        },

        ui: {
            base: {},
            defaults: {},
            selectorGenerator: function (name) {

                var stub = name.match(/[A-Z]?[a-z]+/g).join('_').toLowerCase(),
                    controller = stub.split('_')[0];

                stub = controller + "_" + stub.substr(controller.length + 1).replace('_', '-');

                return '.view-' + stub + ', .' + stub;
            },
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