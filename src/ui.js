/*global Ply, jQuery */
/*jshint bitwise: true, camelcase: true, curly: true, eqeqeq: true, forin: true,
immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: single,
undef: true, unused: true, strict: true, trailing: true, browser: true */

// The UI module provides most of the user-facing functionality
// for Ply.

Ply.ui = (function ($) {

    'use strict';

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

    // ### Augmentations

    // Augment jQuery.cleanData to fire 'remove' event upon elements removal
    // from DOM to facilitate auto destroy.

    // Source code from: [jQuery UI Widget Factory](https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.widget.js)
    var _cleanData = $.cleanData;
    $.cleanData = function (elems) {
        for (var i = 0, elem; (elem = elems[i]) != null; i++) {
            // Fire 'ply-view-removed' instead of 'remove' to prevent any bound events from
            // firing twice when used in conjunction with the widget factory.
            try {
                $(elem).triggerHandler('ply-view-removed');
            } catch (e) {}
        }
        _cleanData(elems);
    };

    // ## Private Functions/Variables

    // ### Base prototype
    // All views inherit from base object.
    var base = {

        // Method for binding elements. Method can be called by view or clients
        // if the DOM gets updated. Note that for event handling, it's better
        // to use event delegation (using jQuery's `delegate` method), than to rebind
        // the elements and attach handlers.
        __bindElements: function () {

            // #### Elements
            // If `this.__elements` is defined, autogenerate the elements.
            if (this.__elements) {
                // Create an empty elements hash to store the elements.
                this.elements = {};

                // Iterate over the own properties of `this.__elements`.
                for (var id in this.__elements) {
                    if (this.__elements.hasOwnProperty(id)) {
                        // Attach the result of calling `this.view.find` with
                        // the provided selector to the respective property of
                        //  `this.elements`.

                        // We intentionally use `this.view.find` and not a global
                        // jQuery search to enforce good encapsulation, avoid clobbering
                        // selectors, and optimize performance.
                        this.elements[id] = this.view.find(this.__elements[id]);
                    }
                }
            }

        },

        // Declare method for binding partials. Method is created for same purposes
        // as `this.__bindElements`.
        __bindPartials: function () {
            
            // #### Partials
            // If `this.__partials` is defined, autogenerate the partials.
            if (this.__partials) {

                // Create empty hash to store partials.
                this.partials = {};

                // Iterate over the own properties of `this.__partials` which have
                // corresponding elements which matched at least one element. Ensures
                // that partials are given a proper view.
                for (var id in this.__partials) {
                    if (this.__partials.hasOwnProperty(id) &&
                        this.elements[id] &&
                        this.elements[id].length) {

                        // Assign to the respective property of `this.partials` the result of
                        // registering a view with the given name, view, and defining view as
                        // its delegate.
                        this.partials[id] = Ply.ui.register(this.__partials[id], {
                            view: this.elements[id],
                            delegate: this
                        });
                    }
                }
            }

        },

        // Declare method for binding notifications. Method is created for same purposes
        // as `this.__bindElements` and `this.__bindPartials`.
        __bindNotifications: function () {
            
            // #### Notifications
            // If `this.__notifications` is defined, autogenerate the notifications.
            if (this.__notifications) {

                // Create empty hash to store notifications handles used to ignore
                // notifications when no longer required.
                this.notifications = {};

                // Iterate over the own properties of `this.__notifications`.
                for (var note in this.__notifications) {
                    if (this.__notifications.hasOwnProperty(note)) {
                        // Listen to the respective notification using the handler string to
                        // reference the given method of the view.
                        this.notifications[note] = Ply.core.listen(note, this[this.__notifications[note]], this);
                    }
                }
            }

        },

        // Declare method to destroy view. `this.__destroyView` is automatically called when view element is
        // removed from the DOM.
        __destroyView: function () {

            var id;
            
            // #### Destroy
            // If `this.__destroy` has been defined by the view invoke it here.
            if ($.isFunction(this.__destroy)) {
                // Any other housekeeping pertaining to a particular view (e.g. unbinding events)
                // should be handled by the view in question by defining `this.__destroy`.
                this.__destroy();
            }

            // Destroy partials.
            for (id in this.partials) {
                if (this.partials.hasOwnProperty(id)) {
                    this.partials[id].__destroyView();
                }
            }

            // Delete delegates reference to `this`.
            if (this.delegate && this.delegate.partials) {
                for (id in this.delegate.partials) {
                    if (this.delegate.partials.hasOwnProperty(id)) {
                        if (this.delegate.partials[id] === this) {
                            delete this.delegate.partials[id];
                        }
                    }
                }
            }

            // Delete delegates reference to `this.view`.
            if (this.delegate && this.delegate.elements) {
                for (id in this.delegate.elements) {
                    if (this.delegate.elements.hasOwnProperty(id)) {
                        if (this.delegate.elements[id][0] === this.view[0]) {
                            delete this.delegate.elements[id];
                        }
                    }
                }
            }
            
            // Ignore all notifications bound using the `__notifications` object.
            // This ensures notifications aren't called multiple times in cases where
            // the view is re-registered and that all references to the view object are
            // removed (assuming events have been unbound) so it can safely be garbage
            // collected by the browser.
            for (var note in this.notifications) {
                if (this.notifications.hasOwnProperty(note)) {
                    Ply.core.ignore(this.notifications[note]);
                }
            }

        },

        // See getOptionOrData
        __getOption: function (option) {

            return getOptionOrData.call(this, option, 'options');
            
        },

        // See setOptionOrData
        __setOption: function (option, value, checkDelegateChain) {

            return setOptionOrData.call(this, option, value, checkDelegateChain, 'options');

        },

        // See getOptionOrData
        __getData: function (data) {

            return getOptionOrData.call(this, data, 'data');

        },

        // See setOptionOrData
        __setData: function (data, value, checkDelegateChain) {

            return setOptionOrData.call(this, data, value, checkDelegateChain, 'data');

        }

    };

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
        this.options = $.extend(true, {}, Ply.config.ui.defaults, this.options, options);

        // #### Data
        // Merge the `data` property of the view, with the data passed to this function
        // from `Ply.ui.register`. Save this in `this.data`.
        this.data = $.extend(true, {}, this.data, data);

        // Invoke `this.__bindElements`.
        this.__bindElements();

        // Invoke `this.__bindPartials`.
        this.__bindPartials();

        // Invoke `this.__bindNotifications`.
        this.__bindNotifications();

        // Listen to the 'ply-view-removed' event to then ignore notifications and delete
        // all references to `this` through `this.__destroyView`.
        this.view.bind('ply-view-removed', $.proxy(this, '__destroyView'));

        // #### Init
        // If an `__init` method is defined, invoke it.
        if (this.__init && typeof this.__init === 'function') {
            this.__init();
        }

        // Return the view.
        return this;
    }

    // ### Get Options or Data
    // Returns `name` from `this.options` / `this.data` starting at `this`
    // then traversing up the views delegate chain until a match is found.

    // `type` can be either 'options' or 'data'.
    function getOptionOrData(name, type) {
        
        var view = this,
            value = this[type][name];

        while (typeof value === 'undefined') {
            if (typeof view.delegate !== 'undefined') {
                view = view.delegate;
                value = view[type][name];
            }
            else {
                break;
            }
        }

        return value;
    }

    // ### Set Options or Data
    // Sets `name` to `value` on `this.options` / `this.data` starting at `this`
    // then traversing up the views delegate chain until a match is found.
    // If `name` cannot be found it will be created on `this.options` / `this.data`.

    // Passing in `checkDelegateChain` as a falsey value will prevent traversal
    // of the views delegate chain and force it to be created on `this.options` / `this.data`.

    // `type` can be either 'options' or 'data'.
    function setOptionOrData(name, value, checkDelegateChain, type) {

        var view = this;

        // `name` can be an object or string, if it is an object it will loop through
        // each property separately.
        if (typeof name === 'object') {
            checkDelegateChain = value;
            for (var prop in name) {
                if (name.hasOwnProperty(prop)) {
                    setOptionOrData.call(this, prop, name[prop], checkDelegateChain, type);
                }
            }
            return;
        }

        // `undefined` or truthy value should pass
        if (checkDelegateChain || typeof checkDelegateChain === 'undefined') {
            while (!(name in view[type])) {
                if (typeof view.delegate !== 'undefined') {
                    view = view.delegate;
                }
                else {
                    view = this;
                    break;
                }
            }
        }

        view[type][name] = value;
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
                // Merge base and `Ply.config.ui.base` to create the prototype view
                // implementations will inherit from.
                basePrototype = $.extend(base, Ply.config.ui.base || {});

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
            this.fn[name].impl = $.extend(Object.create(basePrototype), prototype);

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