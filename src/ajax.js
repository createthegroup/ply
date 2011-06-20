/*global Ply, jQuery */
/*jshint eqeqeq: true, curly: true, white: true */

Ply.ajax = (function ($) {

    return {

        request: function (request, success, failure) {

            var r    = request || {},
                type = r.type  || "GET",
                url  = r.url   || '',
                data = r.data  || {};

            if (Ply.core.debugOn) {
                data.debug = true;
            }

            try {
                return $.ajax({
                    type: type,
                    url: url,
                    data: data,
                    success: function (response) {

                        if (success && typeof success === 'function') {
                            success(response);
                        }

                    },
                    error: function (response) {

                        Ply.core.log('AjaxError: ' + response.status + ' - ' + url, 'warn');

                        Ply.core.error({
                            name: 'AjaxError',
                            message: 'Status: ' + response.status,
                            description: 'URL: ' + url
                        }, 1);

                        if (failure && typeof failure === 'function') {
                            failure(response);
                        }

                    }
                });
            }
            catch (ex) {
                Ply.core.log(ex.message);
                Ply.core.error(ex, 1);
            }

        }

    };

})(jQuery);