import * as domGetters from '../util/dom-getters';
import * as domSetters from '../util/dom-setters';

/*
 * Function that returns an event handler that is called when the models change
 * events are triggered.  It uses the bindings setter to place the value from
 * the model into the DOM.
 */
function makeSetter(setters, selector, view) {
  setters = parseSetters(setters, view);

  return setters.length < 1 ? undefined : function (model, value, data) {
    if (data && data.internal) return;

    const $el = this.$(selector);

    if ($el.length < 1) return;

    setters.forEach((fnc) => {
      fnc($el, value);
    });
  };
}

/*
 * Returns an event handler that is called when DOM events are triggered.
 * It uses the bindings getter to extract a value from
 * the DOM, and the set that value on the model
 */
function makeGetter(fnc, key) {
  return function (e, data) {
    const el = e.currentTarget;

    // TODO manage delayInput on all elements if $el.length > 1
    if (data && data.internal) return;

    let value = fnc(el);

    /* do not set value if we are extracting and no value has been set in DOM
     * element
     */
    if (!value && data && data.extract) return;

    // TODO... should probably unset here
    if (!value && !_.isBoolean(value) && value !== 0) value = null;

    // TODO better passing of observeOptions
    this.model.set(key, value, this.model.observeOptions);
  };
}

/*
 * Creates a set plain object from a ':' seperated string
 */
function parseSetters(setters, view) {
  return _.compact(_.map(setters, (setter) => {
    if (_.isFunction(setter)) return setter.bind(view);

    if (_.isString(setter)) {
      const arr = setter.split(':');

      setter = {
        type: _.head(arr),
        options: _.tail(arr),
      };
    }

    let fnc = domSetters[setter.type];

    if (fnc && setter.options.length > 0) {
      fnc = fnc(..._.isArray(setter.options) ? setter.options : [setter.options]);
    }

    return fnc.bind(view);
  }));
}

/*
 * Fills in any blanks. For example, { type: 'value' } is short for { get:
 * 'value', set: 'value' }.  Also, passing a string as an object will default
 * selector to the string and set type to 'value'. NOTE: maybe it should
 * default to text or HTML? Needs to be called with the view as context (this argument)
 * so the right element is found
 */
function parseBindings(bindings, key) {
  const self = this;

  // handle super short style, ie 'email': '.email'
  if (_.isString(bindings)) {
    const selector = bindings;

    // short style defaults to 'text' setter
    (bindings = {})[selector] = { set: 'text' };
  }

  return _.map(bindings, (binding, selector) => {
    const set = [];
    let get;

    // handle short style, ie '[name="email"]': 'value'
    if (_.isString(binding) || _.isFunction(binding)) {
      set.push(binding);
    } else {
      if (binding.both) {
        get = binding.both;
        set.push(binding.both);
      } else {
        get = binding.get;
      }

      if (binding.set) {
        set.push(binding.set);
      }
    }

    const domGetter = _.isFunction(get) ? get : domGetters[get];
    let getter;

    if (domGetter) {
      getter = makeGetter(domGetter.bind(self), key).bind(self);
      getter.events = domGetter.events;
    }

    return {
      key,
      selector,
      // getter: getter ? getter.bind(self) : undefined,
      getter,
      setter: makeSetter(set, selector, self),
    };
  });
}

export default {
  observe(opts) {
    const self = this;

    this.unobserve();

    if (!this.model) return;

    this.model.observeOptions = opts = _.defaults({ internal: true }, opts);

    this._bindings = _.chain(this.bindings)
      .map(parseBindings.bind(this)).flatten().map((binding) => {
        if (binding.setter) {
          self.listenTo(self.model, `change:${binding.key}`, binding.setter);
        }

        _.each(binding.getter && binding.getter.events, (eventName) => {
          self.delegate(eventName, binding.selector, binding.getter);
        });

        return binding;
      })
      .value();

    if (opts.populate) {
      this.populate();
    }

    if (opts.extract) {
      this.extract();
    }
  },

  unobserve() {
    const self = this;

    _.each(this._bindings, (binding) => {
      self.stopListening(self.model, `change:${binding.key}`, binding.setter);

      _.each(binding.getter && binding.getter.events, (eventName) => {
        self.undelegate(eventName, binding.selector, binding.getter);
      });
    });

    delete this._bindings;
  },

  extract() {
    const self = this;

    this._bindings.forEach((binding) => {
      // eslint-disable-next-line
      binding.getter && self.$(binding.selector).trigger(binding.getter.events[0], { extract: true });
      // binding.getter && binding.setter.call(self, null, self.model.get(binding.key));
    });
  },

  populate() {
    const self = this;

    this._bindings.forEach((binding) => {
      // eslint-disable-next-line
      binding.setter && binding.setter.call(self, null, self.model.get(binding.key));
    });
  },
};
