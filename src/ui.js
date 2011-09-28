/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

// The UI module provides most of the user-facing functionality
// for Ply.

// ## Utility methods

// ### Polyfills

// Create a polyfill for `Object.create` so we can use it
// natively for managing the prototype chain.

// Source code from: [Mozilla Developer Network](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/create).
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts first parameter.');
        }

        function F() {}
        F.prototype = o;
        return new F();
    };
}

Ply.ui = (function ($) {

    // ## Private Functions/Variables

    // ### Instantiate View
    // This is a private function which is called when a view is started.
    // The function expects several arguments &mdash; the name of the view,
    // the jQuery object tied to the view, the options and data objects,
    // and a delegate. The last three may be undefined, but `name` and `view`
    // are required.
    function instantiateView(name, view, options, data, delegate) {

        // Alias `this` for inner functions.
        var self = this;

        // #### Name
        // Assign the view's name to its `name` propery.
        this.name = name;

        // #### View
        // Assign the view to its `view` property. This should not be `undefined`.
        this.view = view;

        // #### Delegate
        // Assign the delegate to its `delegate` property; may be `undefined`. It is up to
        // the respective view to decide on the interface for its delegation.
        this.delegate = delegate;

        // #### Options
        // Merge `Ply.config.ui.defaults`, the `options` property of the view
        // and the options passed in to this function &mdash; which gets passed from the call
        // to `Ply.ui.register` with an `options` object.
        this.options = $.extend({}, Ply.config.ui.defaults, this.options, options);

        // #### Data
        // Merge the `data` property of the view, with the data passed to this function
        // from `Ply.ui.register`. Save this in `this.data`.
        this.data = $.extend({}, this.data, data);

        // #### Objects
        // If `this.__objects` is defined, autogenerate the objects.
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

        // #### Partials
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

        // #### Notifications
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

        // #### Init
        // If an `__init` method is defined, invoke it.
        if (this.__init && typeof this.__init === 'function') {
            this.__init();
        }

        // Return the view.
        return this;
    }

    // ## Public Methods & Properties

    // Return the public methods and properties to be accessible on `Ply.ui`.
    return {

        // ### fn
        // The `fn` property is where each view gets created. Views are globally
        // accesible at `Ply.ui.fn[name]`, though this should be done only by
        // internal methods. To start up a view, you should call `Ply.ui.register`.
        fn: {},

        // ### Define
        // This is the most common method used on `Ply.ui`. It is used for defining
        // views; expects a name and object prototype.
        define: function (name, prototype) {

            // Alias `this` for inner functions.
            var self = this,
                // #### Base
                // Create a `base` object, by making a deep copy of `Ply.config.ui.base`.
                base = Ply.config.ui.base || {};

            // #### Read
            // If no read method has been defined, create one using the `__url` property
            // of the prototype, or pass the view name to `Ply.config.read.urlGenerator`
            // to generate the read function.
            if (!Ply.read[name]) {
                Ply.read.add(name, prototype.__url || Ply.config.read.urlGenerator(name));
            }

            // #### Start-up method
            // Return the result of `instanteView` called on the view object
            // to its named `fn` method.
            this.fn[name] = function (view, options, data, delegate) {
                // The receiving object is a new object with the `impl` set as its prototype.
                return instantiateView.call(Object.create(self.fn[name].impl),
                                            name, view, options, data, delegate);
            };

            // #### Implementation
            // Save the implementation as a property of the startup function.
            // The implementation is an object with the base object as its prototype.
            // We first create an empty object with the base as its prototype, and then
            // perform a deep copy of the `prototype` argument onto the new object.
            this.fn[name].impl = $.extend(Object.create(base), prototype);

            // Alias `Ply.read[name]` to `this.read`.
            this.fn[name].impl.read = Ply.read[name];
        },

        // ### Register
        // Public method for starting up views; accepts a view name, along with
        // some options. The `options` can contain, an explicit `view` or view selector,
        // an object of `options`, `data`, and a `delegate`. See `Ply.ui.start` to see
        // which properties are passed along.
        register: function (name, options) {

            // Alias `Ply.config.ui`.
            var config = Ply.config.ui;

            // Default empty object if options is not defined, or is not
            // an object.
            options = options && typeof options === 'object' ? options : {};

            // #### Register callback
            // An optional callback is available for client use
            // by overriding `Ply.config.ui.onRegister` in `config.js`.
            // If that function is defined, we let the client do any modifications
            // before continuing.
            if (config.onRegister && typeof config.onRegister === 'function') {
                // `onRegister` can return false if it explicitly makes the call to `Ply.ui.start`.
                // We check for `false` explicitly so as not to return on `undefined` if the method
                // simply ends with a bare `return`.
                if (config.onRegister(name, options) === false) {
                    return;
                }
            }

            // #### Autogenerating Views
            // If no view or selector is provided, generate a selector
            // based on the configured implementation. Note that this is the
            // preferred method to register objects. The philosophy of Ply
            // encourages users to rely on well-defined conventions for tying
            // together DOM elements and their respective behaviors.
            if (!options.view) {
                options.view = config.selectorGenerator(name);

                Ply.core.log('No view name supplied, implying: ' + options.view);
            }

            // #### Result
            // We return the result of `Ply.ui.start` so the caller of `Ply.ui.register`,
            // has access to the individual methods and properties of the view object.
            // This is often used for partials, where the delegating object, can call
            // methods of its delegate.
            return this.start(name, options);
        },

        // ### Start
        // The start method is primarily to be used internally, but is left available
        // to clients to call directly. It is simply a wrapper around starting the
        // view.
        start: function (name, o) {

            // Log to the console the view's name.
            Ply.core.log('trying start: ' + name, 'info');

            // Wrap the initialiazation in a try/catch block, and log any errors
            // through `Ply.core`'s error logging mechanism.
            try {
                return this.fn[name]($(o.view), o.options, o.data, o.delegate);
            }
            catch (ex) {
                Ply.core.log(name + ' failed to start.');
                Ply.core.error(ex, 1);

                // If debug mode is enabled, allow the error to bubble.
                if (Ply.core.debugOn) {
                    throw ex;
                }
            }

        }

    };

// Alias `jQuery` to `$` in the module's scope.
})(jQuery);

// &#8618; [Config](config.html)