require('./util/dust-mod');

var dust = require('dustjs-linkedin');

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
		$(function() {
			Backbone.history.start(options);
			Backbone.View.call(app);
		});
	},

	initialize: function() {
		var main = app.$('main');
		app.elements = { main: main };

		app.createPage(_.extend({
			el: main.children()
		}, main.data()));
	},

	createPage: function(options) {
		var model = _.has(options, 'model') ? options.model : _.result(app.router, 'current');

		if (model instanceof Backbone.Model) {
			options = _.extend(model.pick('template'), options);
			options.model = model;
		}

		return app.currentPage = new app.views.Page(options).ready(function() {
			window.scrollTo(this.scrollX || 0, this.scrollY || 0);
		});
	},

	switchPage: function(options) {
		app.currentPage.remove(options);

		app.createPage(options).enter(app.elements.main, options);

		document.title = _.result(app.currentPage, 'title', document.title);
	},

	remember: function(state) {
		if (Backbone.history._usePushState)
			window.history.replaceState(_.extend({}, window.history.state, state), document.title);
	}
});
