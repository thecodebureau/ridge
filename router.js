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
		if (!key) return;

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
				var path = this.get('path');
				return path && path + (this.get('search') || '');
			},

			parse: function(resp) {
				// load templates here so they are ready before any change event is triggered
				_.each(resp && resp.compiled, dust.loadSource);

				return _.has(resp, 'data') ? resp.data : _.omit(resp, 'compiled', 'navigation', 'site');
			}
		})
	}),

	constructor: function(options) {
		this.options = _.omit(options, 'routes');
		Router.apply(this, arguments);
	},

	// creates router if given options object as argument
	route: function(path, name, callback) {
		var router = this,
			root = router.options.root;

		if (_.isString(path)) {
			if (root) path = root + path;
			if (path) root = (path + '/').replace(/\/+$/, '/');
		}

		if (name && typeof name == 'object') {
			router = name instanceof Router ? name :
				new this.constructor(_.extend({ root: root }, name));
			name = '';
		}
		return route.call(router, path, name, callback);
	},

	// update the URL by appending fragment to this.options.root
	navigate: function(fragment, options) {
		var url = this.url(fragment);

		if (options === true) options = { trigger: true };

		this.states.pending = options;
		// ignoring url.hash for now
		Backbone.history.navigate(url.path + url.search, options);
		this.states.pending = false;
		return this;
	},

	execute: function(callback, args) {
		var query = args.pop();

		if (_.isString(query))
			query = parseQueryString(query);

		args.push(query);

		if (callback) callback.apply(this, args);

		var states = this.states,
			options = states.pending;
		states.pending = false;
		var state = this.load(null, { query: query }, options);
		this.transitionTo(state, options);
	},

	// add and fetch new state or update existing state
	load: function(fragment, attrs, opts) {
		var states = this.states,
			state,
			history = Backbone.history;

		if (fragment == null) {
			fragment = history.fragment;
			if (history._usePushState) state = window.history.state;
		}

		var url = this.url(fragment, { root: history.root });

		attrs = _.defaults(_.pick(url, 'path', 'search'), state, attrs);
		attrs.id = fragment;

		opts = _.extend({}, this.options, opts);
		// make sure data passed to fetch is either empty or set to query
		opts.data = opts.url && url.query;

		// get router state or get state by fragment or get initial state
		state = !opts.reload && states.get(this) ||
			states.get(attrs) ||
			states.get(history.decodeFragment((opts.url || url.path) + url.search));

		if (state)
			state.set(_.defaults(attrs, _.result(state, 'defaults')), opts);
		else {
			state = states.add(attrs, opts);
			if (opts.fetch !== false)
				state.loading = state.fetch(opts);
		}

		return state;
	},

	transitionTo: function(state, opts) {
		// save state on router
		this.cid = state.cid;

		var states = this.states,
			previous = states.current;

		states.current = state;

		if (state !== previous) {
			if (previous && !previous.loading)
				previous.trigger('leave', opts);

			opts = _.extend({ state: state, router: this }, this.options, opts);

			state.loading = state.loading || true;

			setTimeout(enter, 0);
		}

		function enter() {
			var loading = state.loading;
			if (state === states.current && loading) {
				if (loading === true) {
					state.loading = false;
					state.trigger('enter', opts);
				} else {
					loading.done(function() {
						state.loading = true;
						enter();
					});
				}
			}
		}
	},

	// generate URL from decoded fragment
	url: function(fragment, opts) {
		fragment = (fragment || '').split('#');

		opts = _.extend({}, this.options, opts);

		var root = opts.root || '',
			url = encodeURI(fragment[0]).replace(/%25/g, '%'),
			path = url.replace(/\?.*/, ''),
			search = url.slice(path.length);

		fragment[0] = '';

		return {
			// remove trailing slash on the root
			path: !path && root.slice(0, -1) || root + path,
			query: search.slice(1),
			search: search,
			hash: fragment.join('#')
		};
	}
});
