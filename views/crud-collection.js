var app = require('ridge');

module.exports = require('ridge/view').extend({
	initialize: function(options) {
		var _view = this;

		_.extend(this, _.pick(options, 'modelTemplate', 'modelView'));

		if(_.isString(options.collection))
			this.collection = new app.collections[options.collection]();

		if(_.isString(this.modelView))
			this.modelView = app.views[this.modelView];

		_view.listenTo(_view.collection, 'reset', _view.reset);
	},

	attach: function() {
		var container = this.$('.container');

		this.container = container.length > 0 ? container : this.$el;
		
		this.collection.fetch({ reset: true });
	},

	reset: function (models, options) {
		models.each(this.renderModel, this);
	},

	renderModel: function(model) {
		if(this.modelView)
			new this.modelView({
				model: model
			}).enter(this.container);
		else
			new app.views.CrudModel({
				model: model,
				template: this.modelTemplate
			}).enter(this.container);
	},
});
