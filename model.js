function dotNotation(obj) {
	var out = {};
	function recurse(value, tree) {
		if(_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
			_.each(value, function(value, key) {
				recurse(value, tree.concat(key));
			});
		} else
			out[tree.join('.')] = value;

	}

	recurse(obj, []);

	return out;
}

// returns a checker function which runs all
// validator functions in the validators array
function validator(tests) {
	return function(value) {
		if(tests[0].fnc._name !== 'required' && !_tests.required(value)) return;

		for(var i = 0; i < tests.length; i++) {
			var obj = tests[i];

			if (!obj.fnc(value)) {
				return obj.message;
			}
		}
	};
}

// enable string formatting like in console log, ie console.log('I like to %s a lot', 'poop') > "I like to poop alot"
function format(str) {
	var args = _.rest(arguments);

	return !args.length ? str : str.replace(/%[a-zA-Z]/, function(match) {
		return args.shift() || match;
	});
}

var _tests = require('./util/validate/tests'),
	_messages = require('./util/validate/messages');

module.exports = Backbone.Model.extend({
	constructor: function(attrs, opts) {
		Backbone.Model.apply(this, arguments);

		var _model = this;

		_model.originalAttributes = _.clone(_model.attributes);

		_model.on('sync', function() {
			_model.originalAttributes = _.clone(_model.attributes);
		});

		_.extend(this, _.pick(opts, 'validation'));

		if(!this.validation)
			this.validate = false;
		else
			this._setupValidation();

		return _model;
	},

	validate: function(attrs, options) {
		options = options || {};

		var _model = this;

		var errors = {};

		if(options.validateAll) {
			_.each(_model.validation, function(validator, key) {
				var error = _model.validation[key](_model.get(key));

				if(error) 
					errors[key] = error;

			});
		} else {
			_.each(dotNotation(attrs), function(value, key) {
				if(_model.validation[key]) {
					var error = _model.validation[key](value);

					if(error) 
						errors[key] = error;
				}
			});
		}

		return _.keys(errors).length > 0 ? errors : undefined;
	},

	get: function(attr) {
		attr = attr.split('.');

		for(var i = 0, ref = this.attributes; ref && i < attr.length; i++) {
			ref = ref[attr[i]];
		}

		return ref;
	},

	idAttribute: '_id',

	isDirty: function() {
		return !_.isEqual(this.attributes, this.originalAttributes);
	},

	isValid: function(options) {
		return this._validate({}, _.defaults({ validateAll: true, validate: true }, options));
	},

	changedAttributes: function(diff, options) {
		var attrs = Backbone.Model.prototype.changedAttributes.apply(this, arguments);

		return options && options.dotNotation ? dotNotation(attrs) : attrs;
	},

	set: function(attr, value, options) {
		if(_.isString(attr)) {
			options = _.defaults({ validate: false }, options);

			var attrs = {};
			attrs[attr] = value;

			var error = this.validate(attrs);

			if (error) {
				_.extend(this.validationError, error);
				value = undefined;
			}

			var namespace = attr.split('.');

			if(namespace.length > 1) {
				var obj = _.clone(this.get(namespace[0])) || {},
					refs = [ obj ];

				for(var i = 1, ref = obj; i < namespace.length - 1; i++) {

					if(_.isObject(ref[namespace[i]])) ref[namespace[i]] = _.clone(ref[namespace[i]]);
					else if(!ref[namespace[i]]) ref[namespace[i]] = {};

					ref = ref[namespace[i]];

					refs.push(ref);
				}

				refs.push(value);

				ref[namespace[i]] = value;

				if(value === undefined) {
					for(i = refs.length - 1; i > 0; i--) {

						if(_.isEmpty(refs[i]))
							delete refs[i - 1][namespace[i]];
					}
				}

				value = _.isEmpty(obj) ? undefined : obj;
				attr = namespace[0];
			}

			if(value === undefined)
				options.unset = true;

			var result = Backbone.Model.prototype.set.call(this, attr, value, options);

			if(error) {
				this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
				return false;
			}

			return result;
		}

		return Backbone.Model.prototype.set.apply(this, arguments);
	},


	reset: function() {
		var _model = this;

		_.each(_model.attributes, function(value, key) {
			if(_.has(_model.originalAttributes, key) && _model.originalAttributes[key] !== undefined)
				_model.set(key, _model.originalAttributes[key]);
			else
				_model.unset(key);
		});
	},

	_setupValidation: function() {
		this.validation = _.mapObject(this.validation, function(validation, attr) {
			var tests = [];

			_.each(validation, function(options, testName) {
				options = options || {};

				if(_tests[testName]) {
					var fnc = options.option ? _tests[testName](options.option) : _tests[testName],
						message = _.isString(options) ? options : options.message || _messages[fnc._name];

					tests[testName === 'required' ? 'unshift' : 'push']({
						message: format.apply(null, [ message ].concat(fnc._parameters)),
						fnc: fnc
					});
				}
			});

			return validator(tests);
		});
	}

});
