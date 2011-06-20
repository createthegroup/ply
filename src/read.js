/*global Ply */
/*jshint eqeqeq: true, curly: true, white: true */

Ply.read = (function () {

    return {

        _create: function (name, url) {

            url = url || Ply.config.read.urlGenerator(name);

            Ply.read[name] = function (data, success, failure) {

                return Ply.ajax.request({
                    url: url,
                    type: 'GET',
                    data: data
                }, success, failure);

            };

        }

    };

})();