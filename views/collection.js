var app = require('../ridge');

module.exports = require('../view').extend({
	initialize: function(options) {
		var _view = this;

		if(!_view.DefaultModelView)
			_view.DefaultModelView = app.views.Model;

		if(!_view.collection) _view.collection = new app.collections[_view.$el.data('collection')]();

		_view.listenTo(_view.collection, 'add', _view.add);
		_view.listenTo(_view.collection, 'remove', _view.remove);
		_view.listenTo(_view.collection, 'reset', _view.reset);

		_view.ModelView = app.views[_view.collection.modelName] || _view.DefaultModelView;

		_view.modelViews = [];
	},

	attach: function() {
		var _view = this;

		var $models = _view.$el.children('.collection,.models');

		_view.elements.$models = $models.length > 0 ? $models.eq(0) : _view.$el;

		var $pagination = _view.$el.children('.pagination');

		_view.pagination = [];

		$pagination.each(function() {
			_view.pagination.push(new app.views.Pagination({ el: this, collection: _view.collection, pagination: _view.pagination }));
		});

		var $filter = _view.$('form.filter');

		$filter.each(function() {
			new app.views.Filter({ el: this, collection: _view.collection });
		});

		_view.collection.fetch({reset: true});
	},

	reset: function(collection, options) {
		var _view = this;

		var offset;

		if(options.previousModels.length > 0)
			offset = _view.el.offsetParent.scrollTop;

		_view.modelViews = _view.modelViews.filter(function(modelView) {
			modelView.remove();
			return false;
		});

		if(_view.elements.$count) _view.elements.$count.text(_view.collection.length);

		_view.collection.each(function(item) {
			_view.add(item, true);
		});

		if(offset)
			if(offset > _view.el.offsetTop)
				_view.el.scrollIntoView();
			else 
				_view.el.offsetParent.scrollTop = offset;
	},

	remove: function() {
		if(this.elements.$count) this.elements.$count.text(this.collection.length);
	},

	add: function(model, reset) {
		if(!reset && this.elements.$count) this.elements.$count.text(this.collection.length);

		var obj = {
			model: model,
			parent: this,
		};

		if(!this.ModelView.prototype.template)
			obj.template = this.templateRoot + 'models/' + this.collection.modelName.toSpinalCase();

		var modelView = new this.ModelView(obj);

		// collections add event calls the callback with 2 parameters, 1: model 2: collection,
		// so we have to check if reset === true
		modelView.enter(this.elements.$models, reset === true ? 'append' : 'prepend');

		this.modelViews.push(modelView);
	},
});
