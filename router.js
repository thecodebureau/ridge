var app = require('./ridge');

module.exports = Backbone.Router.extend({
	routes: {
		'*page': 'page'
	},

	execute: function(callback, args) {
		var query = args.pop(), params = _.extend({}, args);

		if (query) {
			// parse query string
			// assuming single value per field
			_.each(query.split('&'), function(str) {
				var index = str.indexOf('=');
				if (index > 0)
					params[str.slice(0, index)] = decodeURIComponent(str.slice(index + 1).replace('+', ' '));
			});

			// urlencode
			query = encodeURI(query).replace('%25', '%');
		}

		this.params = params;
		this.query = query;

		args.push(query);

		if (callback) return callback.apply(this, args);
	},

	page: function(page, query) {
		var router = this,
			options = { model: page = app.pages.add({ id: page || '' }), query: query };

		// initial route
		if (!app.currentPage) return false;

		if (page === router.loading) return;

		if (page.has('template'))
			loadView();
		else
			(router.loading = page)
				.fetch({ data: query })
				.then(null, function(xhr) {
					// transform error and set options
					var resp = xhr.responseJSON,
						error = _.extend(_.pick(xhr, 'status', 'statusText'), resp);

					options = _.extend({ template: 'error' }, resp);
					options.data = _.extend({ error: error }, options.data || resp);
					return resp;
				})
				.always(function(resp) {
					_.each(resp && resp.compiled, app.dust.loadSource);
					if (router.loading === page)
						loadView();
				});

		function loadView() {
			router.loading = false;
			if (page !== app.currentPage.model)
				app.navigate(_.defaults(options, page.pick('template')));
		}
	}
});
