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

module.exports = function(attrs, options) {
	var _model = this;

	var errors = {};

	attrs = _model.flatten(attrs, _.keys(_model.validation));

	_.each(attrs, function(val, key) {
		if (_.has(_model.validation, key)) {
			if (!_.isFunction(_model.validation[key]))
				_model.validation[key] = setupValidation(_model.validation[key], key, _model);

			var error = _model.validation[key].call(_model, attrs[key]);

			if(error) 
				errors[key] = error;
		}
	});

	if(!_.isEmpty(errors))
		return errors;
};


