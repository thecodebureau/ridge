var _tests = require('../util/validate/tests'),
	_messages = require('../util/validate/messages');

// returns a checker function which runs all
// validator functions in the validators array
// enable string formatting like in console log, ie console.log('I like to %s a lot', 'poop') > "I like to poop alot"
function format(str) {
	var args = _.rest(arguments);

	return !args.length ? str : str.replace(/%[a-zA-Z]/, function(match) {
		return args.shift() || match;
	});
}

function validator(tests, thisArg) {
	return function(value) {
		if(tests[0].fnc._name !== 'required' && !_tests.required(value)) return;

		for(var i = 0; i < tests.length; i++) {
			var obj = tests[i];
			if (!obj.fnc.call(thisArg, value)) {
				return obj.message;
			}
		}
	};
}

function setupValidation(validation, attr, model) {
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

	return validator(tests, model);
}

module.exports = {
	save: function(attrs, options) {
		options = _.extend({ validateAll: true }, options);

		return Backbone.Model.prototype.save.call(this, attrs, options);
	},

	isValid: function(options) {
		return this._validate({}, _.defaults({ validateAll: true, validate: true}, options));
	},

	_validate: function(attrs, options) {
		if (!options.validate || !this.validate) return true;

		var error = this.validationError = this.validate(attrs, options) || null;

		if (!error) return true;

		this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
		return false;
	},

	validate: function(attrs, options) {
		var _model = this;

		var errors = {};

		if(options && options.validateAll)
			attrs = _.object(_.map(_.keys(_model.validation), function(key) {
				return [ key, _model.get(key) ];
			}));
		else
			attrs = _model.flatten(attrs, _.keys(_model.validation));

		_.each(attrs, function(val, key) {
			if (!_.isFunction(_model.validation[key]))
				_model.validation[key] = setupValidation(_model.validation[key], key, _model);

			var error = _model.validation[key].call(_model, attrs[key]);

			if(error) 
				errors[key] = error;
		});

		if(!_.isEmpty(errors))
			return errors;
	}
};


