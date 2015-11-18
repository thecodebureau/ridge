var _getters = require('ridge/getters');
var _setters = require('ridge/setters');

function _setter(/* fncs */) {
	// NOTE element can be an array of elements (currently only for checkbox and radio)
	var fncs = _.toArray(arguments);
	return function($element, value) {
		fncs.forEach(function(fnc) {
			fnc($element, value);
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

function prepareBinding(binding, key) {
		if(_.isString(binding))
			binding = {
				hook: key,
				type: binding
			};
		else
			binding = _.clone(binding);

		if(binding.hook) binding.selector = '[data-hook="' + binding.hook + '"]';

		if(binding.type) binding.get = binding.set = binding.type;

		if(!_.isArray(binding.set)) binding.set = [ binding.set ];

		binding.namespace = key.split('.');

		if(binding.get)
			binding.getter = _getters[binding.get];

		if(binding.set)
			binding.setter = _setter.apply(null, binding.set.map(function(name) {
				return _setters[name];
			}));

		return binding;
}

module.exports = {
	observe: function(opts) {
		var _view = this;

		this.unobserve();

		this._bindings = [];
		
		_.each(this.bindings, function bind(binding, key) {
			function setHandler(model, value, data) {
				if(data && data.internalUpdate) return;

				// TODO should probably be able to loop through value
				for(var i = 0, ref = model.changedAttributes(); ref && i < binding.namespace.length; i++) {
					ref = ref[binding.namespace[i]];
				}

				binding.setter(binding.$el, ref != null ? ref : null);
			}

			function getHandler(e, data) {
				data = data || e.data || {};

				// binding.getter will be undefined if an old event, ie blur, fires
				// after the view is re-rendered
				// TODO manage delayInput on all elements if $el.length > 1
				if(data.internalUpdate || !binding.getter || e.type === 'input' && $el[0].delayInput) return;

				delete $el[0].delayInput;

				var value = binding.getter($el);

				if(!value && !_.isBoolean(value) && value !== 0) value = null;

				if(value === binding.previousValue)
					return;

				binding.previousValue = value;

				_view.model.set(binding.namespace.join('.'), value, _.defaults({
					internalUpdate: true
				}, opts));
			}

			if(_.isArray(binding)) return binding.forEach(function(binding) { bind(binding, key); });

			binding = prepareBinding(binding, key);

			var $el = _view.$(binding.selector);

			if($el.length === 0) return;

			if(opts && opts.delayInput)
				$el[0].delayInput = true;

			if(binding.setter) {
				_view.listenTo(_view.model, 'change:' + binding.namespace[0], setHandler);
			}

			if(binding.getter && binding.getter.events) {
				_.each(binding.getter.events, function(eventName) {
					$el.on(eventName, getHandler);
				});
			}

			_view._bindings.push(_.extend(binding, {
				$el: $el,
				setHandler: setHandler
			}));

		});
	},

	unobserve: function(clear) {
		var view = this;

		_.each(view._bindings, function(binding) {
			view.stopListening(view.model, 'change:' + binding.namespace[0], binding.setHandler);

			_.each(binding.events, function(handler, eventName) {
				binding.$el.off(eventName, handler);
			});

			delete binding.$el;
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

			binding.setter(binding.$el, ref);
		});
	},
};
