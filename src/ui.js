/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

// The UI module provides most of the user-facing functionality
// for Ply.

Ply.ui = (function ($) {

    // Create a private function for instantiating views, which is called when a view is
    // started. The function expects several arguments &mdash; the name of the view,
    // the jQuery object tied to the view, the options and data objects,
    // and a delegate (or `undefined`).
    function instantiateView(name, view, options, data, delegate) {

        // Alias `this` for inner functions.
        var self = this;

        // Assign the view's name to its `name` propery.
        this.name = name;

        // Assign the view to its `view` property. This should not be `undefined`.
        this.view = view;

        // Assign the delegate to its `delegate` property; may be `undefined`. It is up to
        // the respective view to decide on the interface for its delegation.
        this.delegate = delegate;

        // Merge `Ply.config.ui.defaults`, the `opts` property of the view
        // and the options passed in to this function &mdash; which gets passed from the call
        // to `Ply.ui.register` with an options object.
        this.opts = $.extend({}, Ply.config.ui.defaults, this.opts, options);

        // Merge the `data` property of the view, with the data passed to this function
        // from `Ply.ui.register`. Save this in `this.data`.
        this.data = $.extend({}, this.data, data);

        if (this.__objects) {
            this.objects = {};

            this.__bindObjects = function () {
                for (var id in self.__objects) {
                    if (self.__objects.hasOwnProperty(id)) {
                        self.objects[id] = self.view.find(self.__objects[id]);
                    }
                }
            };

            this.__bindObjects();
        }

        if (this.__partials) {
            this.partials = {};

            this.__bindPartials = function () {
                for (var id in self.__partials) {
                    if (self.__partials.hasOwnProperty(id) &&
                        self.objects[id] &&
                        self.objects[id].length) {
                        self.partials[id] = Ply.ui.register(self.__partials[id], {
                            view: self.objects[id],
                            delegate: self
                        });
                    }
                }
            };

            this.__bindPartials();
        }

        if (this.__notifications) {
            for (var note in this.__notifications) {
                if (this.__notifications.hasOwnProperty(note)) {
                    Ply.core.listen(note, this[this.__notifications[note]], this);
                }
            }
        }

        if (this.__init && typeof this.__init === 'function') {
            this.__init();
        }

        return this;
    }

    return {

        fn: {},

        define: function (name, prototype) {

            var self = this,
                base = $.extend({}, Ply.config.ui.base || {});

            if (!Ply.read[name]) {
                Ply.read._create(name, prototype.__url);
            }

            // Alias Ply.read[name] to this.read
            base.read = Ply.read[name];

            this.fn[name] = function (view, options, data, delegate) {
                return instantiateView.call($.extend({}, self.fn[name].impl),
                                            name, view, options, data, delegate);
            };

            this.fn[name].impl = $.extend({}, base, prototype);

            return;
        },

        register: function (name, options) {

            options = options || {};

            if (Ply.config.ui.onRegister &&
                typeof Ply.config.ui.onRegister === 'function') {
                Ply.config.ui.onRegister(name, options);
            }

            if (!options.view) {
                options.view = Ply.config.ui.selectorGenerator(name);

                Ply.core.log('No view name supplied, implying: ' + options.view);
            }

            return this.start(name, options);
        },

        start: function (name, o) {

            Ply.core.log('trying start: ' + name, 'info');

            try {
                return this.fn[name]($(o.view), o.options, o.data, o.delegate);
            }
            catch (ex) {
                Ply.core.log(name + ' failed to start.');
                Ply.core.error(ex, 1);

                if (Ply.core.debugOn) {
                    throw ex;
                }
            }

        }

    };

})(jQuery);