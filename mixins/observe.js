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
	observe: function() {
		var _form = this;

		this._bindings = [];

		_.each(this.bindings, function(opts, key) {
			function setupBinding(opts) {
				if(_.isString(opts))
					opts = {
						hook: key,
						type: opts
					};

				if(opts.hook) opts.selector = '[data-hook="' + opts.hook + '"]';

				if(opts.type) opts.get = opts.set = opts.type;

				if(!_.isArray(opts.set)) opts.set = [ opts.set ];

				var $el = _form.$(opts.selector);

				if($el.length === 0) return;

				var namespace = key.split('.'),
					getter = _getters[opts.get];

				// is object so we can set setter.disabled without having to check
				var setter = {};

				function handler(model, value, opts) {
					//if(opts && opts.internalUpdate) return;
					if(setter.disabled) return;

					for(var i = 0, ref = model.changedAttributes(); ref && i < namespace.length; i++) {
						ref = ref[namespace[i]];
					}

					setter($el, ref != null ? ref : null);
				}

				if(opts.set) {
					setter = _setter.apply(null, opts.set.map(function(name) {
						return _setters[name];
					}));

					_form.listenTo(_form.model, 'change:' + namespace[0], handler);
				}

				if(getter && getter.events) {
					$el.on(getter.events.join(' '), function(e) {
						var value = getter($el);

						setter.disabled = true;

						if(namespace.length > 1) {
							// if the we have namespace of more than one level we
							// need to clone the object, and iterate until we
							// find the right property to set
							var obj = _.clone(_form.model.get(namespace[0])) || {};

							for(var i = 1, ref = obj; i < namespace.length - 1; i++) {
								if(_.isObject(ref[namespace[i]])) ref[namespace[i]] = _.clone(ref[namespace[i]]);
								else if(!ref[namespace[i]]) ref[namespace[i]] = {};

								ref = ref[namespace[i]];
							}

							// remove or set the property depending on if value is set
							if(value != null) {
								if(ref[namespace[i]] && ref[namespace[i]] === value) return;

								ref[namespace[i]] = value;
							} else
								delete ref[namespace[i]];

							// TODO perhaps unset if obj is empty element
							if(_.isEmpty(obj))
								_form.model.unset(namespace[0], { internalUpdate: true });
							else
								_form.model.set(namespace[0], obj, { internalUpdate: true });
						} else {
							// single level namespace, simply set or unset the model attribute
							// depending if value is set
							if(value != null) {
								if(_form.model.get(namespace[0]) === value) return;

								_form.model.set(namespace[0], value, { internalUpdate: true });
							} else
								_form.model.unset(namespace[0], { internalUpdate: true });
						}

						delete setter.disabled;
					});
				}

				_form._bindings.push({
					$el: $el,
					el: $el[0],
					getter: getter,
					setter: setter,
					namespace: key.split('.'),
					handler: handler
				});
			}

			if(_.isArray(opts)) opts.forEach(setupBinding);
			else setupBinding(opts);
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
	}
};
