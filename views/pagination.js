var View = require('ridge/view');

module.exports = View.extend({
	template: 'pagination',

	initialize: function() {
		this.listenTo(this.collection, 'update', this.render);
	},

	render: function() {
		this.data.totalCount = this.collection.totalCount;

		return View.prototype.render.apply(this);
	}
});
