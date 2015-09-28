var app = require('ridge');

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

module.exports = require('ridge/view').extend({
	events: {
		'submit': 'preventDefault'
	},

	initialize: function(opts) {
		_.extend(this, _.pick(opts, 'bindings'));
	},

	subviews: {
		SpytextField: '[data-spytext]',
		ImageUpload: '.image-uploads',
		ModelControls: '.controls'
	},

	attach: function() {
		var _view = this;

		require('ridge/view').prototype.attach.apply(this, arguments);

		//if(!_view.model.isNew())
		//	_view.populate();

		//if(_view.model.isNew())
		//	this.bind();
		//else
		this.bind();
	},

	bind: function() {
		var _form = this;

		this._bindings = [];

		_.each(this.bindings, function(obj, key) {
			if(obj.hook) obj.selector = '[data-hook="' + obj.hook + '"]';

			if(obj.type) obj.get = obj.set = obj.type;

			if(!_.isArray(obj.set)) obj.set = [ obj.set ];

			var namespace = key.split('.');

			var $el = _form.$(obj.selector);

			var getter = _getters[obj.get];

			var setter;
			
			if(obj.set) {
				setter = _setter.apply(null, obj.set.map(function(name) {
					return _setters[name];
				}));
			}

			$el.on(getter.events.join(' '), function() {
				var value = getter($el);

				if(namespace.length > 1) {
					// if the we have namespace of more than one level we
					// need to clone the object, and iterate until we
					// find the right property to set
					var obj = _.clone(_form.model.get(namespace[0])) || {};

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
					_form.model.set(namespace[0], obj, { internalUpdate: true });
				} else {
					// single level namespace, simply set or unset the model attribute
					// depending if value is set
					if(value)
						_form.model.set(namespace[0], value, { internalUpdate: true });
					else
						_form.model.unset(namespace[0], { internalUpdate: true });
				}
			});

			_form.listenTo(_form.model, 'change:' + namespace[0], function(model, value, opts) {
				if(opts && opts.internalUpdate) return;

				console.log('change!');

				for(var i = 0, ref = model.changedAttributes(); ref && i < namespace.length; i++) {
					ref = ref[namespace[i]];
				}

				setter($el, ref || null);
			});

			_form._bindings.push({
				$el: $el,
				el: $el[0],
				getter: getter,
				setter: setter,
				namespace: key.split('.')
			});
		});
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


	setModel: function(model, populate) {
		//var _view = this;

		//if(_view.model) {
		//	_view.stopListening(_view.model);
		//	_view.model.trigger('cancel');
		//}

		//_view.model = model || new _view.collection.model();

		//if(_view.imageUploads) {
		//	_view.imageUploads.forEach(function(imageUpload) {
		//		imageUpload.setModel(_view.model);
		//	});
		//}

		//_view.listenTo(_view.model, 'cancel', _view.setModel.bind(_view, undefined, true));
		//_view.listenTo(_view.model, 'destroy', _view.setModel.bind(_view, undefined, true));

		//if(populate !== false) {
		//	_view.populate();
		//	_view.watch();
		//}

		//if(_view.controls) {
		//	_view.controls.setModel(_view.model);//set model, do update since attach (currently) calls that
		//}

		//_view.$('header h1').text(_view.model.isNew() ? 'Create ' + _view.model.name.toSpaceCase(true) : 'Editing ' + (_view.model.get('title') || _view.model.get('headline') || _view.model.get('name')));
	},
});
