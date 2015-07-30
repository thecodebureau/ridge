require('poirot');
require('jquery-valet');
require('jquery-ancestors');
require('jquery-jsonify');

require('./util/dust-mod');

var dust = require('dustjs-linkedin');

var bases = {
	collections: require('./collection'),
	models: require('./model'),
	views: require('./view')
};

var Router = require('./router');
var Promise = require('./util/promise');

function Ridge(options) {
	var _app = this;

	options = options || {};

	_app.collections = {};
	_app.models = { Model: bases.models };
	_app.views = { View: bases.views };

	// save reference of app

	// TODO: stop referencing this instance in bases' prototypes

	bases.views.prototype.app = _app;
	bases.views.prototype.templateRoot = options.templateRoot || '';

	bases.collections.prototype.modelClasses = _app.models;

	_app.router = new Router(_.extend({ app: _app }, options.router));

	_app.module(options);

	$(function() {
		Backbone.View.call(_app, options);
	});
}

Ridge.prototype = _.create(Backbone.View.prototype, {
	module: function(obj) {
		var _app = this;
		if (!obj) return;
		_.each(bases, function(Base, type) {
			var length;
			while((length = _.keys(obj[type]).length) > 0) {
				_.each(obj[type], function(value, name) {
					var Class = value.extends ? _app[type][value.extends] : Base;

					if(Class) {
						value.name = name;
						_app[type][name] = Class.extend(value);
						delete obj[type][name];
					}
				});

				if(length === _.keys(obj[type]).length) 
					throw new Error('Circular reference in ' + type + '. The following items were left: ' + _.keys(obj[type]).join(', '));
			}
		});

		_.extend(dust.helpers, obj.helpers);
		_.extend(dust.filters, obj.filters);
	},

	dust: dust,

	el: document.documentElement,

	events: {
		'click a.nav': function (evt) {
			var href = $(evt.currentTarget).attr('href');
			var protocol = evt.currentTarget.protocol + '//';

			if (href && href.slice(0, protocol.length) !== protocol) {
				evt.preventDefault();
				Backbone.history.navigate(href, { trigger: true });
			}
		}
	},

	initialize: function() {
		var _app = this;

		_app.elements = {
			main: _app.$('main')
		};

		var pageElement = _app.elements.main.children();

		var View = _app.views[pageElement.data('view') || 'Page'];

		_app.currentPage = new View({ el: pageElement });
	},

	navigate: function(options) {
		var _app = this;

		window.scrollTo(0,0);

		_app.currentPage.remove();

		var View = _app.views[options && options.view || 'Page'];

		_app.currentPage = new View(options);

		_app.currentPage.enter(_app.elements.main[0]);
	},

	// TODO: move login() and logout() to membership component

	login: function(user) {
		this.user = new this.models.User(user);

		if(this.loginForm && this.toggleLoginForm) {
			this.toggleLoginForm();
		}

		Backbone.history.loadUrl(Backbone.history.fragment);

		this.trigger('login');
	},

	logout: function(e) {
		var _app = this;
		e.preventDefault();
		$.ajax({
			url: '/auth/logout',
			dataType: 'json',
			success: function(res, statusText, xhr) {
				window.location.replace('/');
			},
			error: function(res, statusText, error) {
				// TODO
			}
		});
	}
});

module.exports = Ridge;
