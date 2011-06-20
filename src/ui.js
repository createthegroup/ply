/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

Ply.ui = (function ($) {

    function instantiateView(name, view, options, data, delegate) {

        var self = this;

        this.view = view;

        this.delegate = delegate;

        this.opts = $.extend({}, Ply.config.ui.defaults, this.opts, options);

        this.data = $.extend({}, this.data, data);

        this.name = name;

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

        create: function (name, options) {

            var self = this,
                args = Array.prototype.slice.call(arguments);

            options = args[args.length - 1];

            // Trim the first and last arguments (name and options)
            args = args.slice(1, args.length - 1);

            // Add callback to arguments
            args.push(function (response) {

                options.view = response;

                self.register(name, options);

            });

            // Call the API method with the registration code as the callback
            Ply.read[name].apply(this, args);

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