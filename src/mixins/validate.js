import * as _tests from '../util/tests';
import _messages from '../util/test-messages';

// returns a checker function which runs all
// validator functions in the validators array
// enable string formatting like in console log, ie console.log('I like to %s a
// lot', 'poop') > "I like to poop alot"
function format(str, ...args) {
  return !args.length ? str : str.replace(/%[a-zA-Z]/, (match) => args.shift() || match);
}

function validator(tests, thisArg) {
  return function (value) {
    // b do not run tests if field is not required and not set
    if (tests.length > 0 && tests[0].fnc._name !== 'required' && !_tests.required(value)) return;

    for (let i = 0; i < tests.length; i++) {
      const obj = tests[i];
      if (!obj.fnc.call(thisArg, value)) {
        return obj.message;
      }
    }
  };
}

function setupValidation(validation, attr, model) {
  const tests = [];

  _.each(validation, (options, testName) => {
    if (!options) return;

    if (!_.isPlainObject(options)) {
      if (_.isString(options)) {
        // if options is string, we assume it is an error message
        options = { message: options };
      } else if (_.isBoolean(options)) {
        // if options === true, set empty options object
        options = {};
      } else {
        options = { option: options };
      }
    }

    if (_tests[testName]) {
      const fnc = options.option ? _tests[testName](options.option) : _tests[testName];
      const message = options.message || _messages[fnc._name];

      tests[testName === 'required' ? 'unshift' : 'push']({
        message: format(...[message].concat(fnc._parameters)),
        fnc,
      });
    }
  });

  return validator(tests, model);
}

export default {
  save(attrs, options) {
    if (options && options.validate === false || this.isValid()) {
      return Backbone.Model.prototype.save.call(this, attrs, _.defaults({
        validate: false,
      }, options));
    }
  },

  isValid(options) {
    return this.validate(null, options);
  },

  _validate(attrs, options) {
    // Do not value internal set in save, which will be called with
    // options.xhr: (if (serverAttrs && !model.set(serverAttrs, options))
    // return false;)
    if (options.validate && !options.xhr) {
      this.validate(attrs, options);
    }

    // always return true so that the value gets set on the model no matter what.
    return true;
  },

  validate(attrs, options) {
    const self = this;
    const errors = {};
    const valid = [];

    if (attrs) {
      // TODO does not handle testing a.b.c if a.b is set (which should probably fail)
      attrs = _.pick(attrs, _.keys(this.validation));
    } else {
      options = options || {};

      // this is to let form-styling view know to focus errored first element.
      // See line 92 in views/form-styling
      options.validateAll = true;

      attrs = _.mapValues(this.validation, (value, key) => self.get(key));
    }

    _.each(attrs, (val, key) => {
      if (!_.isFunction(self.validation[key])) {
        self.validation[key] = setupValidation(self.validation[key], key, self);
      }

      const error = self.validation[key].call(self, attrs[key]);

      if (error) {
        errors[key] = error;
      } else {
        valid.push(key);
      }
    });

    this.trigger('validated', this, errors, valid, options);

    return _.isEmpty(errors);
  },

  // returns validation
  getBindings(type) {
    type = type || 'value';

    return _.mapValues(this.validation, (value, key) => {
      const binding = {};

      binding[`[name="${key}"],[data-name="${key}"]`] = {
        both: type,
      };

      return binding;
    });
  },
};
