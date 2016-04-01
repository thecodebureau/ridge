//var dust = require('dustjs-linkedin');
var Router = Backbone.Router;
var route = Router.prototype.route;

// Parse query string into an object.
// Understands array values serialized by jQuery.param() without nesting.
//
//	'a=1&a=2&b[]=3&c=' ->
//	{ a: ['1', '2'], b: ['3'], c: '' }
//
function parseQueryString(query) {
	var result = {};

	_.each(query.replace(/\+/g, ' ').split('&'), function(key) {
		var index = key.indexOf('='),
			val = '';

		if (index >= 0) {
			val = decodeURIComponent(key.slice(index + 1));
			key = key.slice(0, index);
		}

		key = decodeURIComponent(key);

		// brackets notation for array value
		if (key.slice(-2) == '[]') {
			key = key.slice(0, -2);
			val = [val];
		}

		// if there are multiple values per key, concatenate
		result[key] = _.has(result, key) ? [].concat(result[key], val) : val;
	});

	return result;
}

module.exports = Router.extend({
	// application states shared by router instances
	states: new Backbone.Collection(null, {
		model: Backbone.Model.extend({
			url: function() {
				var id = this.get('id');
				return id && encodeURI(id);
			},

			parse: function(resp) {
				// load templates here so they are ready before any change event is triggered
				//_.each(resp && resp.compiled, dust.loadSource);

				return _.has(resp, 'data') ? resp.data : _.omit(resp, 'compiled', 'navigation', 'site');
			}
		})
	}),

	initialize: function(options, routes) {
		this.options = _.omit(options, 'routes');
		this.routes = routes;
	},

	// creates router if given options object as argument
	route: function(path, name, callback) {
		var router = this,
			root = router.root;

		if (_.isString(path)) {
			if (root) path = root + path;
			if (path) root = (path + '/').replace(/\/+$/, '/');
		}

		if (name && typeof name == 'object') {
			router = name instanceof Router ? name :
				new this.constructor(_.defaults({ routes: null }, name), name.routes);
			router.root = root;
			router._bindRoutes();
			delete router.routes;
			name = '';
		}
		return route.call(router, path, name, callback);
	},

	execute: function(callback, args) {
		var query = args.pop(),
			search = null;

		if (_.isString(query)) {
			search = '?' + encodeURI(decodeURI(query));
			query = parseQueryString(query);
		}

		this.params = _.extend({}, args);
		if (Backbone.history._usePushState)
			_.defaults(this.params, window.history.state);
		this.query = query || {};
		this.search = search;

		args.push(query);

		if (callback) callback.apply(this, args);
	},

	load: function(options) {
		options = _.extend({ remove: false }, this.options, options);

		var states = this.states,
			state = states.current,
			history = Backbone.history;

		if (this.id == null || options.reload)
			this.id = decodeURI(options.url || history.root + history.fragment);

		// cancel current transition
		if (state && state.loading) {
			states.remove(state);
			state.loading.abort();
		}

		state = _.pick(this, 'id', 'params', 'query', 'search');

		var existing = states.get(state);

		state = states.current = states.set(state, options);

		state.loading = (!existing || options.reload) && state.fetch(options)
		.always(function() {
			state.loading = false;
		});

		return state;
	},
});
