var domGetters = require('ridge/util/dom-getters');
var domSetters = require('ridge/util/dom-setters');

/*
 * Function that returns an event handler that is called when the models change
 * events are triggered.  It uses the bindings setter to place the value from
 * the model into the DOM.
 */
function makeSetter(setters, selector) {
	setters = parseSetters(setters);

	return setters.length < 1 ? undefined : function(model, value, data) {
		if(data && data.internal) return;

		var $el = this.$(selector);

		if($el.length < 1) return;

		setters.forEach(function(fnc) {
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
		var el = e.currentTarget;

		// TODO manage delayInput on all elements if $el.length > 1
		if(data && data.internal) return;

		var value = fnc(el);

		// TODO... should probably unset here
		if(!value && !_.isBoolean(value) && value !== 0) value = null;

		// TODO better passing of observeOptions
		this.model.set(key, value, this.model.observeOptions);
	};
}

/*
 * Creates a set plain object from a ':' seperated string
 */
function parseSetters(setters) {
	return _.compact(_.map(setters, function(setter) {
		if(_.isFunction(setter)) return setter;

		if(_.isString(setter)) {
			var arr = setter.split(':');

			setter = {
				type: _.head(arr),
				options: _.tail(arr)
			};
		}

		var fnc = domSetters[setter.type];

		if(fnc && setter.options.length > 0)
			fnc = fnc.apply(null, _.isArray(setter.options) ? setter.options : [ setter.options ]);

		return fnc;
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
	var self = this;

	if(_.isString(bindings)) {
		var selector = bindings;

		(bindings = {})[selector] = { set: 'text' };
	}

	return _.map(bindings, function(binding, selector) {
		var get, set = [];

		if(_.isString(binding)) {
			set.push(binding);
		} else {
			if(binding.both) {
				get = binding.both;
				set.push(binding.both);
			} else
				get = binding.get;

			if(binding.set) 
				set.push(binding.set);
		}

		var domGetter = domGetters[get],
			getter;

		if(domGetter) {
			getter = makeGetter(domGetter, key).bind(self);
			getter.events = domGetter.events;
		}

		return {
			key: key,
			selector: selector,
			//getter: getter ? getter.bind(self) : undefined,
			getter: getter,
			setter: makeSetter(set, selector)
		};
	});
}

module.exports = {
	observe: function(opts) {
		var self = this;

		this.unobserve();

		if(!this.model) return;

		this.model.observeOptions = opts = _.defaults({ internal: true }, opts);

		this._bindings = _.chain(this.bindings).map(parseBindings, this).flatten().map(function(binding) {
			if(binding.setter) 
				self.listenTo(self.model, 'change:' + binding.key, binding.setter);

			_.each(binding.getter && binding.getter.events, function(eventName) {
				self.delegate(eventName, binding.selector, binding.getter);
			});

			return binding;
		}).value();

		if(opts.populate)
			this.populate();
	},

	unobserve: function(clear) {
		var self = this;

		_.each(this._bindings, function(binding) {
			self.stopListening(self.model, 'change:' + binding.key, binding.setter);

			_.each(binding.getter && binding.getter.events, function(eventName) {
				self.undelegate(eventName, binding.selector, binding.getter);
			});
		});

		delete this._bindings;
	},

	populate: function(clear) {
		var self = this;

		this._bindings.forEach(function(binding) {
			binding.setter.call(self, null, self.model.get(binding.key));
		});
	},
};
