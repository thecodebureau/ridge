var defaultRoutes = {
	"*page": "page",
};

module.exports = Backbone.Router.extend({
	initialize: function(options) {
		options = options || {};

		var router = this;

		if(_.isString(options.root)) {
			this.root = options.root.split('/').filter(function(val) {
				return !!val;
			});
		}

		this.app = options.app;

		options.routes = _.defaults(options.routes || {}, defaultRoutes);

		_.each(options.routes, function(value, key) {
			var path = router.root ? router.root.concat(key) : [ key ];

			router.route(path.join('/'), value);
		});
	},

	page: function(page, index) {
		var _router = this;

		var arr =  page ? [ page ] : [];

		var path = '/' + (this.root ? this.root.concat(arr) : arr).join('/');

		$.getJSON(path)
			.fail(function(xhr) {
				_.each(xhr.responseJSON.compiled, _router.app.dust.loadSource);
				_router.app.navigate(xhr.responseJSON);
			}).done(function(res, txt, xhr) {
				if(res.data && res.data.page && res.data.page.path !== path) {
					_router.navigate(res.data.page.path, { trigger: true, replace: true });
				} else {
					_.each(res.compiled, _router.app.dust.loadSource);
					_router.app.navigate(res);
				}
			});
	}
});
