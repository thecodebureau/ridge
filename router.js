var dust = require('dustjs-linkedin'),
	Router = Backbone.Router,
	route = Router.prototype.route;

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
			parse: function(resp) {
				// load templates here so they are ready before any change event is triggered
				_.each(resp && resp.compiled, dust.loadSource);

				return _.has(resp, 'data') ? resp.data : _.omit(resp, 'compiled');
			}
		})
	}),

	initialize: function(options) {
		this.options = _.omit(options, 'routes');
	},

	// creates router if given options object as argument
	route: function(route, name, callback) {
		var router = this;
		if (name == null || typeof name == 'object') {
			router = new this.constructor(name);
			name = '';
		}
		return route.call(router, route, name, callback);
	},

	execute: function(callback, args) {
		var query = args.pop(),
			search = null;

		if (_.isString(query)) {
			search = '?' + encodeURI(decodeURI(query));
			query = parseQueryString(query);
		}

		this.params = _.extend({}, args);
		this.query = query;
		this.search = search;

		args.push(query);

		if (callback) callback.apply(this, args);
	},

	load: function(options) {
		options = _.extend({ remove: false }, this.options, options);

		var states = this.states,
			state = states.current,
			history = Backbone.history,
			id = history.root + decodeURI(history.fragment);

		// cancel current transition
		if (state && state.loading) {
			states.remove(state);
			state.loading.abort();
		}

		if (!states.get(this.id)) this.id = id;

		state = _.pick(this, 'id', 'params', 'query', 'search');

		var existing = states.get(state);

		state = states.current = states.set(state, options);
		state.url = encodeURI(id);

		state.loading = !existing && state.fetch(options)
		.always(function() {
			state.loading = false;
		});

		return state;
	},
});
