function dotNotation(obj) {
	var out = {};
	function recurse(value, tree) {
		if(_.isObject(value) && !_.isDate(value) && !_.isArray(value) && !_.isFunction(value)) {
			_.each(value, function(value, key) {
				recurse(value, tree.concat(key));
			});
		} else
			out[tree.join('.')] = value;

	}

	recurse(obj, []);

	return out;
}

function get(obj, path) {
	path = path.split('.');

	while (obj != null && path.length)
		obj = obj[path.shift()];

	return obj;
}

var _validate = Backbone.Model.prototype._validate;

module.exports = Backbone.Model.extend({
	constructor: function(attrs, opts) {
		this.on('change', function(model) {
			_.each(model.flattened, function(path) {
				delete model.attributes[path];
			});
			// delete undefined
			model.set(model.pick(_.isUndefined), { unset: true });
		});

		Backbone.Model.apply(this, arguments);

		var _model = this;

		_model.originalAttributes = _.clone(_model.attributes);

		_model.on('sync', function() {
			_model.originalAttributes = _.clone(_model.attributes);
		});

		_.extend(this, _.pick(opts, 'validation'));
	},

	get: function(attr) {
		// unflatten changes in set() before triggering change events
		if (_.some(this.flattened, this.hasChanged, this))
			_.extend(this.attributes, this.changed = this.unflatten(this.changed));

		return get(this.attributes, attr);
	},

	idAttribute: '_id',

	isDirty: function() {
		return !_.isEqual(this.attributes, this.originalAttributes);
	},

	changedAttributes: function(diff, options) {
		var attrs = Backbone.Model.prototype.changedAttributes.apply(this, arguments);

		return options && options.dotNotation ? dotNotation(attrs) : attrs;
	},

	save: function(attrs, options) {
		options = _.extend({ validateAll: true }, options);

		return Backbone.Model.prototype.save.call(this, attrs, options);
	},

	_validate: function(attrs, options) {
		this.flatten(_.keys(attrs));

		if (!options.validate || !this.validate) return true;

		if (options.validateAll)
			attrs = _.extend({}, this.attributes, attrs);

		attrs = dotNotation(attrs);
		var error = this.validationError = this.validate(attrs, options) || null;
		if (!error) return true;
		this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
		return false;
	},

	// set dot-delimited paths directly on this.attributes
	flatten: function(paths) {
		var attributes = this.attributes;

		this.flattened = _.filter(paths, function(path) {
			var index = path.lastIndexOf('.');
			if (index < 0) return false;

			var key = path.slice(0, index),
				obj = key in attributes ? attributes[key] : get(attributes, key);

			attributes[path] = obj == null ? void 0 : obj[key.slice(index + 1)];
			return true;
		});

		return this;
	},

	// return an unflattened copy of attrs
	// merged over corresponding nested attributes in this.attributes
	unflatten: function(attrs) {
		var result = {},
			attributes = this.attributes;

		_.each(attrs, function(val, key) {
			var path = key.split('.');

			key = path.pop();

			var obj = _.reduce(path, makeNested, result);

			if (val === void 0)
				delete obj[key];
			else
				obj[key] = val;
		});

		function makeNested(obj, key, level) {
			var attrs = level || _.has(obj, key) ? obj : attributes;

			obj = obj[key] = {};

			// copy nested attributes
			_.some(attrs[key], function(val, key) {
				// check that we are not iterating an array-like object
				if (typeof key == 'number') return true;
				obj[key] = val;
			});

			return obj;
		}

		return result;
	},

	reset: function(options) {
		var attrs = {};
		for (var key in this.attributes) attrs[key] = void 0;

		return this.set(_.extend(attrs, this.originalAttributes), options);
	},
});
