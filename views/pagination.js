var app = require('ridge'),
	View = require('ridge/view');

module.exports = View.extend({
	template: 'pagination',

	initialize: function() {
		this.listenTo(this.collection, 'reset', this.render);
	},

	render: function() {
		this.state.set('totalCount', this.collection.totalCount);

		return View.prototype.render.apply(this);
	}
});
