var defaultRoutes = {
	"*page": "page"
};

module.exports = Backbone.Router.extend({
	initialize: function(options) {
		options = options || {};

		var _router = this;

		_.extend(_router, _.pick(options, [ 'app', 'root' ]));

		if(_router.root) {
			// ensure trailing '/' in root
			if(!/\/$/.test(_router.root)) 
				_router.root = _router.root + '/';
		} else
			_router.root = '/';

		_.each(_.extend(defaultRoutes, options.routes), function(value, path) {
			_router.route(_router.root.slice(1) + path, value);
		});
	},

	page: function(page, index) {
		var _router = this;

		page = page || '';

		$.getJSON(_router.root + page)
			.fail(function(xhr) {
				_.each(xhr.responseJSON.compiled, _router.app.dust.loadSource);
				_router.app.navigate(xhr.responseJSON);
			}).done(function(res, txt, xhr) {
				if(res.data && res.data.page && res.data.page.path.slice(1) !== page) {
					_router.navigate(res.data.page.path, { trigger: true, replace: true });
				} else {
					_.each(res.compiled, _router.app.dust.loadSource);
					_router.app.navigate(res);
				}
			});
	}
});
