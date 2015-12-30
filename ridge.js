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
		app.router = new Router({
			routes: this.routes
		});

		Backbone.history.start(options);

		// prevent scrolling on popState with { scrollRestoration: 'manual' }
		_.extend(window.history, _.pick(options, 'scrollRestoration'));

		$(function() {
			Backbone.View.call(app);
		});
	},

	initialize: function() {
		var main = app.$('main');
		app.elements = { main: main };

		var page = app.createPage(_.extend({
			el: main.children()
		}, app.router.options));

		page.ready(page.scroll);
	},

	createPage: function(options) {
		var view = options && options.view;
		if (!_.isFunction(view)) view = app.views[view || 'Page'];

		return app.currentPage = new view(options);
	},

	switchPage: function(options) {
		window.scrollTo(0, 0);

		app.currentPage.leave(options);

		app.createPage(options).enter(app.elements.main, options);

		document.title = _.result(app.currentPage, 'title', document.title);
	},

	remember: function(state) {
		if (Backbone.history._usePushState)
			window.history.replaceState(_.extend({}, window.history.state, state), document.title);
	}
});
