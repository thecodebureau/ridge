var fncs = {
	cancel: function(model) {
		$(this)[model.isNew() || !model.collection ? 'hide' : 'show']().prop(this.disabled, false);
	},
	publish: function(model) {
		$(this)[!model.isNew() && !model.get('datePublished') ? 'show' : 'hide']().prop('disabled', model.isDirty());
	},
	unpublish: function(model) {
		$(this)[!model.isNew() && model.get('datePublished') ? 'show' : 'hide']().prop('disabled', model.isDirty());
	},
	delete: function(model) {
		this.disabled = model.isNew() || model.isDirty();
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

var app = require('ridge');

module.exports = require('ridge/view').extend({
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
		this.model.save({ isBlocked: true }, { patch: true, wait: true });
	},

	setModel: function(model, update) {
		var _view = this;

		if(_view.model) 
			_view.stopListening();
		
		if(model) {
			_view.model = model;

			_view.listenTo(_view.model, 'change sync cancel', _view.update);
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
		this.model.save({ datePublished: null }, { patch: true, wait: true });
	},

	publish: function(e) {
		this.model.save({ datePublished: new Date() }, { patch: true, wait: true });
	},

	cancel: function() {
		if(!this.model.isDirty() || confirm('Are you sure you want to cancel?'))
			this.model.trigger('cancel').fetch();
	},

	edit: function(e) {
		var _view = this;

		e.preventDefault();

		_view.model.trigger('edit', _view.model);
	},

	create: function() {
		if(this.collection) {
			this.collection.add(this.model);
		}

		this.model.save(null, {
			success: function(model, response, opts) {
				var path = _.initial(window.location.pathname.split('/')).join('/') + '/' + model.id;
				app.router.navigate(path, { replace: true });
			}
		});
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
				this.model.fetch();
			}
	},
});
