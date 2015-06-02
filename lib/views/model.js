var _setters = {
	html: function(value) {
		$(this).html(value);
	},
	value: function(value) {
		$(this).val(value);
	},
	published: function(value) {
		$el = $(this).closest('[data-published]');

		$el.attr('data-published', (!!value).toString());
	},
	parts: function(value) {
		if(!_.isDate(value)) ref = new Date(value);

		ref = ref.toLocaleString('se-SV').split(' ');
		
		$(this).find('[data-part]').toArray().forEach(function(part, index) {
			$(part).val(ref[index]);
		});
	},
	src: function(value) {
		$(this).attr('src', value);
	}
};

var _getters = {
	html: function() {
		return $(this).html();
	},
	value: function() {
		return $(this).val();
	},
	parts: function(value) {
		var parts = $(this).find('[data-part]').toArray();
		// if the property is in "parts" we need to collect vales from all
		// the parts (elements). return if not all parts are set
		if(_.some(parts, function(el) { 
			return !($(el).val() || $(el).html()); 
		}))
			return null;
		else
			return parts.map(function(el) { return ($(el).val() || $(el).html()); }).join(' ').trim();
	},
	src: function(value) {
		return $(this).attr('src');
	}
};

function _setter(element/* pointer */) {
	var pointers = _.map(_.rest(arguments), function(fnc) {
		return fnc.bind(element);
	});

	return function(value) {
		pointers.forEach(function(fnc) {
			fnc(value);
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
	tagName: 'article',

	initialize: function(options) {
		this.listenTo(this.model, 'sync', this.populate);

		this.listenTo(this.model, 'destroy', this.remove);
	},

	attach: function() {
		var _view = this;
		var $controls = _view.$('.controls');

		if($controls.length > 0) {
			if(!_view.controls) {
				// create new FormControls view if none exists
				_view.controls = new _view.app.views.ModelControls({ el: _view.$('.controls'), model: _view.model, collection: _view.collection, parent: _view });
			} else {
				// update FormControls view with correct element (since the FormView view has been rerendred) and model
				_view.controls.setElement(_view.$('.controls'));
				_view.controls.setModel(_view.model, false);//set model, do update since attach (currently) calls that
			}
		}

		this.properties = {};

		this.namespaces = [];

		// we need to use the same instance of Dust as Bassline, requiring will
		// most likely get the wrong instance
		var dust = this.app.dust;

		this.$('[property]').not(':has([property])').each(function() {
			// we figure out the namespace of the property by
			// checking the nesting of elements with the property attribute.
			// first we collect all ancestors that match within this view
			// convert to array, add the current element and then map the array
			// return the value of property. Result will be [ 'image', 'caption' ],
			// [ 'author', 'address', 'streetAddress' ] or similar
			var namespace = $(this).ancestors('[property]', _view.el).add(this).toArray().map(function(el) {
				return $(el).attr('property');
			});

			var pointers = $(this).data('pointers');

			pointers = pointers ? pointers.split(',') : [];

			// TODO maybe check for data-parts in descendants instead of setting data-pointers="parts"
			if(pointers.indexOf('parts') < 0) {
				switch(this.tagName) {
					case 'INPUT':
						pointers.unshift('value');
						break;
					case 'IMG':
						pointers.unshift('src');
						break;
					default:
						pointers.unshift('html');
						break;
				}
			}

			if(_.last(namespace) === 'datePublished') 
				pointers.push('published');

			var filters = $(this).data('filters');

			filters = filters ? filters.split(',') : [];

			if(pointers.indexOf('parts') < 0 && this.tagName === 'TIME') 
					filters.push('d_datetime');

			filters = _.compact(filters.map(function(val) {
				return dust.filters[val];
			}));

			var setters = _.compact(pointers.map(function(str) {
				return _setters[str];
			}));

			for(var i = 0, ref = _view.properties; i < namespace.length - 1; i++) {
				if(!ref[namespace[i]]) ref[namespace[i]] = {};
				ref = ref[namespace[i]];
			}

			// TODO only one getter
			ref[namespace[i]] = {
				element: this,
				filter: filters.length > 0 ? _filter.apply(null, filters) : undefined,
				getter: _getters[pointers[0]].bind(this),
				setter: _setter.apply(null, [ this ].concat(setters))
			};

			_view.namespaces.push(namespace);
		});

		//this.watch();
	},

	populate: function(clear) {
		clear = clear === true;

		var _view = this;

		this.namespaces.forEach(function(namespace) {
			for(var i = 0, attr = _view.model.attributes, prop	= _view.properties; i < namespace.length; i++) {
				if(attr)
					attr = attr[namespace[i]];

				prop = prop[namespace[i]];

				if(!prop)
					return;
			}

			if(clear || !attr)
				attr = '';
			else if(attr)
				if(prop.filter) attr = prop.filter(attr);

			prop.setter(attr);
		});
	},

	// Watch loops through all namespaces (of properties) in the DOM,
	// and sets up one- or twoway watch.
	watch: function(twoway) {
		var _view = this;

		this.namespaces.forEach(function(namespace) {

			// sets up the view to listen for a change
			// in a specific attribute on the model (only first
			// level of namespace is used since Backbone models do not
			// support set and get of nested properties), and update the
			// connected element(s) as required.
			function startListening() {
				_view.listenTo(_view.model, 'change:' + namespace[0], function(model) {
					for(var i = 0, ref = model.changedAttributes(), fnc = this.properties; ref && i < namespace.length; i++) {
						ref = ref[namespace[i]];
					}

					if(ref && filter) ref = filter(ref);

					setter(ref || null);
				});
			}

			// removes the event listener that startListening sets up
			function stopListening() {
				_view.stopListening(_view.model, 'change:' + namespace[0]);
			}

			for(var i = 0, ref = _view.properties; i < namespace.length; i++) {
				ref = ref[namespace[i]];
			}

			var parts,
				filter = ref.filter,
				getter = ref.getter,
				setter = ref.setter,
				el = ref.element;

			startListening();

			var events;
			if(twoway && ((events = $._data(el, 'events')) || !_.has(events, 'change'))) {
				// listen to the change event on the element. spytext elements
				$(el).on('change', function() {

					// stop listening so the the view doesnt react when
					// it sets the model itself
					stopListening();

					var value = getter();

					if(namespace.length > 1) {
						// if the we have namespace of more than one level we
						// need to clone the object, and iterate until we
						// find the right property to set
						var obj = _.clone(_view.model.get(namespace[0])) || {};

						for(var i = 1, ref = obj; i < namespace.length - 1; i++) {
							if(!ref[namespace[i]]) ref[namespace[i]] = {};

							ref = ref[namespace[i]];
						}

						// remove or set the property depending on if value is set
						if(value)
							ref[namespace[i]] = value;
						else
							delete ref[namespace[i]];

						// TODO perhaps unset if obj is empty element
						_view.model.set(namespace[0], obj);
					} else {
						// single level namespace, simply set or unset the model attribute
						// depending if value is set
						if(value)
							_view.model.set(namespace[0], value);
						else
							_view.model.unset(namespace[0]);
					}
					// model is set, start listening again.
					startListening();
				});
			}
		});
		
		if(twoway) {
			var $properties = this.$('[property]').not(':has([property])').not('.spytext-field').on('keyup', function() {
				// trigger change on keyups, not only blur
				$(this).trigger('change');
			});
		}

		this.watching = true;
	},

	toggleWatch: function() {
		var _view = this;

		if(_view.watching) {
			_view._callbacks = {};

			_.each(_view._listeningTo[_view.model._listenId]._events, function(value, key) {
				if(key.substring(0,6) === 'change')
					value.forEach(function(obj) {
						if(obj.ctx === _view) {
							_view.model.off(key, obj.callback, _view);
							_view._callbacks[key] = obj.callback;
						}
					});
			});
		} else {
			_.each(_view._callbacks, function(callback, name) {
				_view.model.on(name, callback, _view);
			});
		}
	},

	setModel: function(model, populate) {
		var _view = this;

		if(_view.model) {
			_view.stopListening(_view.model);
			_view.model.trigger('cancel');
		}

		_view.model = model || new _view.collection.model();

		_view.listenTo(_view.model, 'cancel', _view.setModel.bind(_view, undefined, true));
		_view.listenTo(_view.model, 'destroy', _view.setModel.bind(_view, undefined, true));

		if(_view.controls) {
			_view.controls.setModel(_view.model);//set model, do update since attach (currently) calls that
		}

		if(populate !== false) {
			_view.populate(_view.model.isNew());
			_view.watch();
		}
	},

	cancelEdit: function() {
		this.$el.removeClass('editing');
	},
};
