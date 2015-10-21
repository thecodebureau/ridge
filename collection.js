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

	parse: function(resp) {
		if(resp.totalCount) {
			this.totalCount = resp.totalCount;

			return _.find(resp, _.isArray);
		}

		return resp;
	}

});
