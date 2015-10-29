var _tests = require('./tests'),
	_messages = require('./messages');

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

function setupValidation(validation, attr) {
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

	return validator(tests, _model);
}

return function(attrs, options) {
	var _model = this;

	var errors = {};

	_.each(_model.validation, function(validator, key, validators) {
		if (!_.isFunction(validator))
			validator = validators[key] = setupValidation(validator, key);

		var error = validator.call(_model, _model.get(key));

		if(error) 
			errors[key] = error;

	});

	return !_.isEmpty(errors) || errors;
};
