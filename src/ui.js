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

        // If this.__objects is defined, autogenerate the objects.
        if (this.__objects) {
            // Create an empty objects hash to store the objects.
            this.objects = {};

            // Create a function for binding objects. A function is created so
            // the view or clients can call `__bindObjects` on the view, if the
            // DOM gets updated. Note that for event handling, it's better to use
            // event delegation (using jQuery's `delegate` method), than to rebind
            // the objects and attach handlers.
            this.__bindObjects = function () {
                // Iterate over the own properties of `this.__objects`.
                for (var id in self.__objects) {
                    if (self.__objects.hasOwnProperty(id)) {
                        // Attach the result of calling `this.view.find` with
                        // the provided selector to the respective property of
                        //  `this.objects`.

                        // We intentionally use `this.view.find` and not a global
                        // jQuery search to enforce good encapsulation, avoid clobbering
                        // selectors, and optimize performance.
                        self.objects[id] = self.view.find(self.__objects[id]);
                    }
                }
            };

            // Invoke `this.__bindObjects`.
            this.__bindObjects();
        }

        // If `this.__partials` is defined, autogenerate the partials.
        if (this.__partials) {
            // Create empty hash to store partials.
            this.partials = {};

            // Declare function for binding partials. Function is created for same purposes
            // as `this.__bindObjects`.
            this.__bindPartials = function () {
                // Iterate over the own properties of `this.__partials` which have
                // corresponding objects which matched at least one element. Ensures
                // that partials are given a proper view.
                for (var id in self.__partials) {
                    if (self.__partials.hasOwnProperty(id) &&
                        self.objects[id] &&
                        self.objects[id].length) {

                        // Assign to the respective property of `this.partials` the result of
                        // registering a view with the given name, view, and defining view as
                        // its delegate.
                        self.partials[id] = Ply.ui.register(self.__partials[id], {
                            view: self.objects[id],
                            delegate: self
                        });
                    }
                }
            };

            // Invoke `this.__bindPartials`
            this.__bindPartials();
        }

        // If `this.__notifications` is defined.
        if (this.__notifications) {
            // Iterate over the own properties of `this.__notifications`. Note that we do not
            // create and immediately invoke a function here since notifications never need to
            // be re-bound.
            for (var note in this.__notifications) {
                if (this.__notifications.hasOwnProperty(note)) {
                    // Listen to the respective notification using the handler string to
                    // reference the given method of the view.
                    Ply.core.listen(note, this[this.__notifications[note]], this);
                }
            }
        }

        // If an `__init` method is defined, invoke it.
        if (this.__init && typeof this.__init === 'function') {
            this.__init();
        }

        // Return the view.
        return this;
    }

    // Return the public methods and properties to be accessible on `Ply.ui`.
    return {

        // The `fn` property holds is where each view gets created. Views are globally
        // accesible at `Ply.ui.fn[name]`.
        fn: {},

        // This is the most common method used on `Ply.ui`. It is used for defining
        // views; expects a name and object prototype.
        define: function (name, prototype) {

            // Alias `this` for inner functions.
            var self = this,
                // Create a `base` object, by making a deep copy of `Ply.config.ui.base`.
                base = $.extend({}, Ply.config.ui.base || {});

            // If no read method has been defined, create one using the `__url` property
            // of the prototype.
            if (!Ply.read[name]) {
                Ply.read._create(name, prototype.__url);
            }

            // Alias `Ply.read[name]` to `this.__read`.
            base.__read = Ply.read[name];

            // Save an `instanteView` call to `Ply.ui.fn[name]`.
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