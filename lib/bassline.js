require('./util/string-helpers');
require('./util/dust-mod');
require('./util/jquery-ext');

var bases = {
	collections: require('./collection'),
	models: require('./model'),
	views: require('./view')
};

function Bassline(options) {
	var _app = this;

	_.extend(_app, _.omit(options, _.keys(bases)));

	// set up jquery
	_app.$el = $(_app.el);
	_app.$ = _app.$el.find.bind(_app.$el);

	// save reference of app

	_app.models = {};
	_app.collections = {};

	bases.views.prototype.app = _app;

	bases.collections.prototype.models = _app.models;

	// Set up the base views (not user defined);
	_app.views = _.extend({
		View: bases.views
	}, _.mapObject(require('./views'), function(value, key) {
		return bases.views.extend(value);
	}));


	addModule.call(this, _.pick(options, [ 'models', 'collections', 'views' ]));

	return _app;
}

function addModule(module) {
	var _app = this;
	_.each(bases, function(Base, type) {
		var length;
		while((length = _.keys(module[type]).length) > 0) {
			_.each(module[type], function(value, name) {
				var Class = value.extends ? _app[type][value.extends] : Base;

				if(Class) {
					_app[type][name] = Class.extend(value);
					delete module[type][name];
				}
			});

			if(length === _.keys(module[type]).length) 
				throw new Error('Circular reference in ' + type + '. The following items were left: ' + _.keys(module[type]).join(', '));
		}
	});
}

Bassline.prototype = {
	addModule: addModule
};

_.extend(Bassline.prototype, Backbone.Events);

module.exports = Bassline;
