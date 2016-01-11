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
		// do not run tests if field is not required and not set
		if(tests.length > 0 && tests[0].fnc._name !== 'required' && !_tests.required(value)) return;

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
		if(!options) return;

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
		if(options && options.validate === false || this.isValid())
			return Backbone.Model.prototype.save.call(this, attrs, _.defaults({ validate: false }, options));
	},

	isValid: function(options) {
		return this.validate(null, options);
	},

	_validate: function(attrs, options) {
		// Do not value internal set in save, which will be called with options.xhr: (if (serverAttrs && !model.set(serverAttrs, options)) return false;)
		if (options.validate && !options.xhr)
			this.validate(attrs, options);
			
		// always return true so that the value gets set on the model no matter what.
		return true;
	},

	validate: function(attrs, options) {
		var self = this,
			errors = {},
			valid = [];

		if(attrs) {
			// TODO does not handle testing a.b.c if a.b is set (which should probably fail)
			attrs = _.pick(attrs, _.keys(this.validation));
		} else {
			attrs = _.mapValues(this.validation, function(value, key) {
				return self.get(key);
			});
		}

		_.each(attrs, function(val, key) {
			if (!_.isFunction(self.validation[key]))
				self.validation[key] = setupValidation(self.validation[key], key, self);

			var error = self.validation[key].call(self, attrs[key]);

			if(error) 
				errors[key] = error;
			else
				valid.push(key);
		});

		this.trigger('validated', this, errors, valid, options);

		return _.isEmpty(errors);
	}
};


