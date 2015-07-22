var fncs = {
	cancel: function(model) {
		$(this)[model.isNew() ? 'hide' : 'show']().prop(this.disabled, false);
	},
	publish: function(model) {
		$(this)[!model.isNew() && !model.get('datePublished') ? 'show' : 'hide']().prop('disabled', false);
	},
	unpublish: function(model) {
		$(this)[!model.isNew() && model.get('datePublished') ? 'show' : 'hide']().prop('disabled', false);
	},
	delete: function(model) {
		this.disabled = model.isNew();
	},
	create: function(model) {
		$(this)[model.isNew() ? 'show' : 'hide']().prop('disabled', !model.isDirty());
	},
	save: function(model) {
		$(this)[!model.isNew() ? 'show' : 'hide']().prop('disabled', !model.isDirty());
	},
	reset: function(model) {
		$(this).prop('disabled', !model.isDirty());
	},
	block: function(model) {
		$(this).prop('disabled', false);
	}
};

module.exports = {
	events: {
		'click button': 'stopPropagation',
		'click button[data-command="block"]': 'block',
		'click button[data-command="cancel"]': 'cancel',
		'click button[data-command="create"]': 'create',
		'click button[data-command="publish"]': 'publish',
		'click button[data-command="reset"]': 'reset',
		'click button[data-command="delete"]': 'delete',
		'click button[data-command="save"]': 'save',
		'click button[data-command="unpublish"]': 'unpublish'
	},

	initialize: function(options) {
		this.setModel(options.model, false);
	},

	attach: function(update) {
		var _view = this;

		this.fncs = {};

		_view.$('button').each(function() {
			var command = $(this).data('command');

			_view.fncs[command] = fncs[command].bind(this);
		});

		if(update !== false && this.model)
			_view.update();
	},

	block: function() {
		this.model.set('isBlocked', true);
		this.model.patch();
	},

	setModel: function(model, update) {
		var _view = this;

		if(_view.model) 
			_view.stopListening();
		
		if(model) {
			_view.model = model;

			_view.listenTo(_view.model, 'change', _view.update);
			_view.listenTo(_view.model, 'sync', _view.update);
		} else {
			_view.model = null;
		}

		if(update !== false)
			_view.update();
	},

	// Commands:
	
	stopPropagation: function(e) {
		e.stopPropagation();
	},

	update: function() {
		var _view = this;

		_.each(_view.fncs, function(fnc, name) {
			fnc(_view.model);
		});
	},

	unpublish: function(e) {
		this.model.unset('datePublished');
		this.model.patch();
	},

	publish: function(e) {
		this.model.set('datePublished', new Date());
		this.model.patch();
	},

	cancel: function() {
		if(!this.model.isDirty() || confirm('Are you sure you want to cancel?'))
			this.model.trigger('cancel');
	},

	edit: function(e) {
		var _view = this;

		e.preventDefault();

		_view.$('button').prop('disabled', true);

		_view.stopListening(_view.model);

		if(_view.parent) {
			//_view.parent.toggleWatch();
			_view.parent.$el.siblings().removeClass('editing');

			_view.listenToOnce(_view.model, 'cancel', function() {
				_view.listenTo(_view.model, 'change', _view.update);
				_view.listenTo(_view.model, 'sync', _view.update);
				_view.update();
				_view.parent.$el.removeClass('editing');
			});

			_view.parent.$el.addClass('editing');
		}

		_view.app.trigger('edit:' + _view.model.name, _view.model);
	},

	delete: function(e) {
		if(confirm('Are you sure you want to delete the ' + this.model.name + '?')) {
			this.model.destroy();
			this.remove();
		}
	},

	create: function() {
		if(this.collection) {
			this.collection.add(this.model);
			this.model.save();
		} else {
			this.app.trigger('create:' + this.model.name, this.model);
		}
	},

	save: function() {
		this.model.save();
	},

	reset: function() {
		if(confirm('Are you sure you want to reset?'))
			if(this.model.isNew()) {
				this.model.clear();
				this.model._clearDirty();
				this.update();
			} else {
				// TODO do not fetch
				this.model.fetch({ success: this.update }).done(function(resp) {
	console.log('reset and fetched model', resp);
				});
			}
	},
};
