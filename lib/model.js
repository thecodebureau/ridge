module.exports = Backbone.Model.extend({
	constructor: function(attributes) {
		Backbone.Model.apply(this, arguments);

		this.on('sync', this._clearDirty);
		if(this._id)
			this._setFetched;
		else
			this.once('sync', this._setFetched);

		this.on('change', this._updateDirty);

		this._clearDirty();

		return this;
	},

	_setFetched: function() {
		this.fetched = true;
	},

	_clearDirty: function() {
		this.dirtyAttributes = {};
	},

	_updateDirty: function(e) {
		_.extend(this.dirtyAttributes, _.mapObject(this.changed, function(val) {
			return (val === undefined) ? null : val;
		}));
	},

	idAttribute: '_id',

	isDirty: function() {
		return _.keys(this.dirtyAttributes).length !== 0;
	},

	patch: function(options) {
		var _model = this;
		
		if(_.keys(this.dirtyAttributes).length < 1)
			return;

		options = (options || {});

		options.patch = true;

		this.off('change');

		var args = [ this.dirtyAttributes, options ];

		var xhr = this.__super__('save', args);

		if(xhr) {
			xhr.always(function() {
				_model.on('change', _model._updateDirty);
			});
		}
	}
});
