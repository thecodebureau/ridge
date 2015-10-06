var app = require('ridge');

module.exports = Backbone.Collection.extend({
	constructor: function(attributes, options) {
		var _collection = this;

		Backbone.Collection.apply(_collection, arguments);

		if(_.isString(_collection.model)) {
			_collection.modelName = _collection.model;
			if(app.models[_collection.model])
				_collection.model = app.models[_collection.model];
			else {
				_collection.model = require('ridge/model').extend({
					name: _collection.model
				});
			}
		}

		return _collection;
	},

	reset: function (models, options) {
		var _collection = this;

		options = options || {};

		for (var i = 0, l = _collection.models.length; i < l; i++) {
			_collection._removeReference(_collection.models[i], options);
		}

		options.previousModels = _collection.models;

		_collection._reset();

		models = _collection.add(models, _.extend({silent: true}, options));

		if (!options.silent) _collection.trigger('reset', _collection, options);

		return models;
	}
});
