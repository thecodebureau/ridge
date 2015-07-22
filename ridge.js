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

function Bassline(options) {
	var _app = this;

	options = options || {};

	_.extend(_app, _.omit(options, _.keys(bases)));

	// set up jquery
	_app.$el = $(_app.el);
	_app.$ = _app.$el.find.bind(_app.$el);

	// save reference of app

	_app.models = {
		Model: bases.models
	};
	_app.collections = {};

	bases.views.prototype.app = _app;
	bases.views.prototype.templateRoot = options.templateRoot || '';

	bases.collections.prototype.modelClasses = _app.models;

	// Set up the base View
	_app.views = {
		View: bases.views
	};

	options.views = options.views || {};

	_.extend(options.views, require('./views'));

	this.module(_.pick(options, [ 'models', 'collections', 'views' ]));

	return _app;
}

Bassline.prototype = {
	module: function(obj) {
		var _app = this;
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
	},

	dust: dust,

	dustModule: function(obj) {
		if(obj)
			_.each(obj, function(entities, type) {
				if(dust[type])
					_.each(entities, function(entity, name) {
						dust[type][name] = entity;
					});
			});
		else
			return dust;
	}
};

_.extend(Bassline.prototype, Backbone.Events);

module.exports = Bassline;
