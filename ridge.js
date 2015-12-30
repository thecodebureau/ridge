require('./util/dust-mod');

var dust = require('dustjs-linkedin');

var Router = require('./router');

var app = module.exports = _.create(Backbone.View.prototype, {
	dust: dust,

	helpers: dust.helpers,

	filters: dust.filters,

	el: document.documentElement,

	events: {
		'click a[href]:not([target])': function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which == 2 || e.button == 2 || e.isDefaultPrevented())
				return;

			var href = e.currentTarget.href,
				root = location.protocol + '//' + location.host + Backbone.history.root,
				index = root.length - 1;

			// if the URL matches the root
			if (href.slice(0, index) + '/' == root) {
				e.preventDefault();
				// navigate to URL fragment without the root
				Backbone.history.navigate(href.slice(index).replace(/^#/, '/#'), { trigger: true });
			}
		}
	},

	extend: function() {
		_.each(arguments, function(arg) {
			_.each(arg, function(value, key) {
				app[key] = typeof value == 'object' && /s$/.test(key) ?
					_.extend(app[key] || {}, value) : value;
			});
		});
		return app;
	},

	start: function(options) {
		app.elements = { main: $('main') };

		app.router = new Router({
			routes: this.routes
		});

		app.router.states.reset(options.states, { parse: true });

		Backbone.history.on('route', app.onRoute);

		Backbone.history.start(options);

		// prevent scrolling on popState with { scrollRestoration: 'manual' }
		if(window.history.scrollRestoration)
			_.extend(window.history, _.pick(options, 'scrollRestoration'));

		Backbone.View.call(app);
	},

	onRoute: function(router, name) {
		var previous = router.states.current,
			state = router.load();

		if (previous && state === previous) return;

		var options = _.extend({
			state: state,
			router: router,
			name: name
		}, router.options);

		var done = app.switchPage.bind(this, options);

		if (state.loading)
			state.loading.done(done);
		else
			done();
	},

	createPage: function(options) {
		var view = options && options.view;

		if (!_.isFunction(view)) view = app.views[view || 'Page'];

		return app.currentPage = new view(options);
	},

	switchPage: function(options) {
		//var index = app.navigation.render().index();

		// set animation class
		//options.className = 
		//	index > navIndex ? 'forward' :
		//	index < navIndex ? 'back' :
		//	'';

		//navIndex = index;

		if(app.currentPage) {
			if(window.history.scrollRestoration === 'manual') {
				window.scrollTo(0, 0);

				_.result(app.currentPage, 'unscroll');
			}

			app.currentPage.leave(options);
		} else {
			var $el = app.elements.main.children();

			if($el.length) options.el = $el;
		}

		var page = app.createPage(options);

		if(!page.el.parentNode)
			page.enter(app.elements.main, options);

		document.body.className = options.state.get('page').name;

		document.title = _.result(page, 'title', document.title);
	},

	remember: function(state) {
		if (Backbone.history._usePushState)
			window.history.replaceState(_.extend({}, window.history.state, state), document.title);
	}
});
