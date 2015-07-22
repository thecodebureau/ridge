module.exports = Backbone.Collection.extend({
	constructor: function(attributes, options) {
		var _collection = this;

		Backbone.Collection.apply(_collection, arguments);

		if(_.isString(_collection.model)) {
			if(_collection.modelClasses[_collection.model])
				_collection.model = _collection.modelClasses[_collection.model];
			else {
				_collection.model = _collection.modelClasses.Model.extend({
					name: _collection.model
				});
			}
		}

		if(options && options.defaultFilter)
			_collection.defaultFilter = options.defaultFilter;

		_collection.filter = _.clone(_collection.defaultFilter);

		_collection.modelName = _collection.model.prototype.name;

		return _collection;
	},

	defaultFilter: {},

	reset: function (models, options) {
		var _collection = this;

		options = options || {};

		for (var i = 0, l = _collection.models.length; i < l; i++) {
			_collection._removeReference(_collection.models[i], options);
		}

		options.previousModels = _collection.models;

		_collection._reset();

		models = _collection.add(models, _.extend({silent: true}, options));

		_collection.totalCount = parseInt(options.xhr.getResponseHeader('X-Collection-Length'));

		if (!options.silent) _collection.trigger('reset', _collection, options);

		return models;
	},
	
	fetch: function(options) {
		var _collection = this;

		options = options || {};

		if(_collection.filter)
			options = _.extend(options || {}, { data: _collection.filter, processData: true });

		Backbone.Collection.prototype.fetch.call(_collection, options);
	},

	setPage: function(page) {
		if(page > 1)
			this.filter._skip = (page - 1) * (this.filter._limit || this.length);
		else
			delete this.filter._skip;
	},

	setFilter: function(filter) {
		if(filter)
			this.filter = filter;
		else
			this.filter = _.clone(this.defaultFilter);
	},


});
