var app = require('ridge'),
	View = require('ridge/view');

module.exports = View.extend({
	template: 'pagination',

	initialize: function() {
		this.listenTo(this.collection, 'update', this.render);
	},

	render: function() {
		app.router.current().set('totalCount', this.collection.totalCount);

		return View.prototype.render.apply(this);
	}
});
