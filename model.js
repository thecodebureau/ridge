module.exports = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		var _model = this;

		_model.originalAttributes = _.clone(_model.attributes);

		_model.on('sync', function() {
			_model.originalAttributes = _.clone(_model.attributes);
		});

		return _model;
	},

	idAttribute: '_id',

	isDirty: function() {
		return !_.isEqual(this.attributes, this.originalAttributes);
	},

	reset: function() {
		var _model = this;

		_.each(_model.attributes, function(value, key) {
			if(_.has(_model.originalAttributes, key) && _model.originalAttributes[key] !== undefined)
				_model.set(key, _model.originalAttributes[key]);
			else
				_model.unset(key);
		});
	}
});
