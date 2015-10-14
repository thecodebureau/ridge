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

	reset: function (models, options) {
		models.each(this.renderModel, this);
	},

	attach: function() {
		if(!this.container || (this.container[0] !== this.el && $.contains(document.documentElement, this.container[0]))) {
			var container = this.$('.container');

			this.container = container.length > 0 ? container : this.$el;
		}
		
		this.collection.fetch({ reset: true });
	},

	// override default render function so no errors are cause by lack
	// of template but we still attach
	render: function() {
		this.attach();
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
