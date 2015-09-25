require('poirot');
require('jquery-valet');
require('jquery-ancestors');
require('jquery-jsonify');

require('./util/dust-mod');

var dust = require('dustjs-linkedin');

var app = module.exports = _.create(Backbone.View.prototype, {

	dust: dust,

	helpers: dust.helpers,

	filters: dust.filters,

	pages: new Backbone.Collection(null, {
		model: Backbone.Model.extend({
			url: function() {
				return '/' + encodeURI(this.id);
			},

			parse: function(resp) {
				return _.has(resp, 'data') ? resp.data : resp;
			}
		})
	}),

	el: document.documentElement,

	events: {
		'click a.nav': function (evt) {
			var href = $(evt.currentTarget).attr('href');
			var protocol = evt.currentTarget.protocol;

			if (href && href.slice(0, protocol.length) !== protocol) {
				evt.preventDefault();
				Backbone.history.navigate(href, { trigger: true });
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
		app.currentPage = new app.views.Page(_.extend({
			model: app.pages.first(),
			el: main.children()
		}, main.data()));
	},

	navigate: function(options) {
		app.currentPage.remove();

		// create new view for the page, insert it into DOM (with enter) and save
		// the returned view to _app.currentPage
		app.currentPage = new app.views.Page(options)
			.enter(app.elements.main)
			.ready(function() {
				window.scrollTo(this.scrollX || 0, this.scrollY || 0);
			});

		document.title = _.result(app.currentPage, 'title', document.title);
	},

	remember: function(state) {
		if (Backbone.history._usePushState)
			window.history.replaceState(_.extend({}, window.history.state, state), document.title);
	}
});
