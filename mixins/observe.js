var _getters = require('ridge/getters');
var _setters = require('ridge/setters');

function _setter(/* fncs */) {
	// NOTE element can be an array of elements (currently only for checkbox and radio)
	var fncs = _.toArray(arguments);
	return function(element, value) {
		fncs.forEach(function(fnc) {
			fnc(element, value);
		});
	};
}

function _filter(/* filters */) {
	var filters = _.toArray(arguments);

	return function(value) {
		filters.forEach(function(fnc) {
			value = fnc(value);
		});

		return value;
	};
}

module.exports = {
	observe: function(opts) {
		var _view = this;

		this._bindings = [];

		_.each(this.bindings, function(binding, key) {
			function setupBinding(binding) {
				function setHandler(model, value, binding) {
					if(binding && binding.internalUpdate) return;
					//if(setter.disabled) return;

					// TODO should probably be able to loop through value
					for(var i = 0, ref = model.changedAttributes(); ref && i < namespace.length; i++) {
						ref = ref[namespace[i]];
					}

					setter($el, ref != null ? ref : null);
				}

				function getHandler(e, data) {
					data = data || e.data || {};

					if(data.internalUpdate) return;

					var value = getter($el) || undefined;

					_view.model.set(namespace.join('.'), value, setOptions);
				}

				if(_.isString(binding))
					binding = {
						hook: key,
						type: binding
					};

				if(binding.hook) binding.selector = '[data-hook="' + binding.hook + '"]';

				if(binding.type) binding.get = binding.set = binding.type;

				if(!_.isArray(binding.set)) binding.set = [ binding.set ];

				var $el = _view.$(binding.selector);

				if($el.length === 0) return;

				var namespace = key.split('.'),
					getter = _getters[binding.get],
					setter = {};

				// is object so we can set setter.disabled without having to check

				if(binding.set) {
					setter = _setter.apply(null, binding.set.map(function(name) {
						return _setters[name];
					}));

					_view.listenTo(_view.model, 'change:' + namespace[0], setHandler);
				}

				var setOptions = {
					validate: _.isBoolean(binding.validate) ? binding.validate : !!(opts && opts.validate),
					internalUpdate: true
				};

				if(getter && getter.events) {
					var events = _.isFunction(getter.events) ? getter.events(getHandler) : _.object(getter.events.map(function(eventName) {
						return [ eventName, getHandler ];
					}));

					_.each(events, function(handler, eventName) {
						$el.on(eventName, handler);
					});
				}

				_view._bindings.push({
					$el: $el,
					el: $el[0],
					getter: getter,
					setter: setter,
					namespace: key.split('.'),
					setHandler: setHandler
				});
			}

			if(_.isArray(binding)) binding.forEach(setupBinding);
			else setupBinding(binding);
		});
	},

	unobserve: function() {
		var view = this;
		_.each(view._bindings, function(binding) {
			view.stopListening(view.model, 'change:' + binding.namespace[0], binding.handler);
			binding.$el.off();
			delete binding.$el;
			delete binding.el;
			delete binding.getter;
			delete binding.setter;
			delete binding.namespace;
			delete binding.handler;
		});

		delete this._bindings;
	},

	populate: function(clear) {
		var _view = this;

		this._bindings.forEach(function(binding) {
			namespace = binding.namespace;

			for(var i = 0, ref = _view.model.attributes; i < namespace.length; i++) {
				if(ref)
					ref = ref[namespace[i]];
			}

			if(ref && binding.filter) ref = binding.filter(ref);

			binding.setter(binding.el, ref);
		});
	},
};
