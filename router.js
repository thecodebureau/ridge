var dust = require('dustjs-linkedin');

module.exports = Backbone.Router.extend({
	routes: {
		'*page': 'page'
	},

	// holds the current state and any pending state
	states: new Backbone.Collection(null, {
		model: Backbone.Model.extend({
			url: function() {
				return Backbone.history.root + encodeURI(decodeURI(this.id));
			},

			parse: function(resp) {
				// load templates here so they are ready before any change event is triggered
				_.each(resp && resp.compiled, dust.loadSource);

				return _.has(resp, 'data') ? _.extend(_.pick(resp, 'template'), resp.data) : resp;
			}
		})
	}),

	current: function() {
		return this.states.first();
	},

	initialize: function() {
		this.listenTo(this.states, 'change:loading', function(state, value) {
			this.loading = value;
			if (!value) this.states.set(state); 	// removes previous state (if any)
		});
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
			query = encodeURI(decodeURI(query));
		}

		this.params = params;
		this.query = query;

		args.push(query);

		this.loading = false;
		this.states.remove(this.states.filter('loading'));

		if (callback) callback.apply(this, args);
	},

	page: function(page, query) {
		page = this.states.add({ id: page || '' });
		page.set('query', query);

		// avoid fetching on initial route
		if (this.states.length == 1) return;

		if (page.has('template'))
			this.states.set(page);
		else
			this.load(page, { data: query });
	},

	load: function(state, options) {
		var xhr = state.set('loading', true).fetch(options);

		return xhr.fail(function(xhr) {
			var attrs = state.parse(xhr.responseJSON);
			state.set(_.extend({ template: 'error', error: attrs }, attrs));
		})
		.always(function() {
			state.unset('loading');
		});
	}
});
