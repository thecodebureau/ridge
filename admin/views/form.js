var Spytext = require('spytext');

module.exports = {
	extends: 'CrudModel',

	events: {
		'submit form': 'submit'
	},

	initialize: function (options) {
		if(this.collection)
			this.listenTo(this.app, 'edit:' + this.collection.modelName, this.setModel);
	},

	attach: function() {
		var _view = this;

		_view.app.views.CrudModel.prototype.attach.apply(this, arguments);

		_view.elements.$form = this.$('form');

		if(_view.collection) {
			_view.setModel(null, true);
		}

		_view.$('[data-spytext]').each(function(i, el) {
			// TODO clear previous spytext fields
			if(!_view.spytext) _view.spytext = new Spytext();

			_view.spytext.addField(el);
		});

		_view.$('.image-upload').each(function() {
			if(!_view.imageUploads) _view.imageUploads = [];

			// TODO do we need to save reference for these views and remove when rerendering?
			_view.imageUploads.push(new _view.app.views.ImageUpload({ el: this, model: _view.model }));
		});

		_view.watch(true);

		_view.initializeViews();
		
		if(!_view.model.isNew())
			_view.populate();
	},

	setModel: function() {
		var _view = this;

		_view.app.views.CrudModel.prototype.setModel.apply(this, arguments);

		if(_view.imageUploads) {
			_view.imageUploads.forEach(function(imageUpload) {
				imageUpload.setModel(_view.model);
			});
		}

		_view.$('header h1').text(_view.model.isNew() ? 'Create ' + _view.model.name.toSpaceCase(true) : 'Editing ' + (_view.model.get('title') || _view.model.get('headline') || _view.model.get('name')));

		//if(_view.model.isNew() && _view.elements.$form) _view.elements.$form[0].reset();
	},


	// TODO hande over submit control to form controls view
	submit: function(e) {
		e.preventDefault();
	}
};
