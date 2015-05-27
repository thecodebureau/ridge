require('poirot');
require('./util/dust-mod');
require('./util/jquery-ext');

var dust = require('dustjs-linkedin');

var bases = {
	collections: require('./collection'),
	models: require('./model'),
	views: require('./view')
};

_.each(bases, function(base, type) {
	base.prototype.__super__ = function(method, args) {
		var prototype = this.constructor.__super__;

		while(prototype) {
			if(prototype[method]) 
				return prototype[method].apply(this, args);

			prototype = prototype.constructor.__super__;
		}
	};
});

function Bassline(options) {
	var _app = this;

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
