module.exports = Backbone.Model.extend({
	constructor: function(attributes) {
		Backbone.Model.apply(this, arguments);

		this.on('sync', this._clearDirty);
		this.on('change', this._updateDirty);

		this._clearDirty();

		return this;
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

	sync: function () {
		function done() {
			_model._syncing = false;
		}

		var _model = this;

		_model._syncing = true;

		_model.once('sync', done);
		_model.once('error', done);

		return Backbone.sync.apply(_model, arguments);
	},

	patch: function(options) {
		var _model = this;
		
		if(_.keys(this.dirtyAttributes).length < 1)
			return;

		options = (options || {});

		options.patch = true;

		this.off('change');

		var args = [ this.dirtyAttributes, options ];

		var xhr = Backbone.Model.prototype.save.apply(this, args);

		if(xhr) {
			xhr.always(function() {
				_model.on('change', _model._updateDirty);
			});
		}
	}
});
