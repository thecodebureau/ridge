var app = require('ridge');

module.exports = require('ridge/view').extend({
	events: {
		'click button': function(e) {
			e.stopPropagation();
		},
		'click button[data-command="edit"]': 'edit',
		'click button[data-command="publish"]': 'publish',
		'click button[data-command="delete"]': 'delete',
		'click button[data-command="unpublish"]': 'unpublish'
	},

	edit: function(e) {
		app.router.navigate(window.location.pathname + '/' + this.model.id, { trigger: true });
	},

	delete: function(e) {
		if(confirm('Are you sure you want to delete the ' + this.model.name + '?')) {
			this.model.destroy();
			this.remove();
		}
	},

	unpublish: function(e) {
		this.model.save({ datePublished: null }, { patch: true, wait: true });
	},

	publish: function(e) {
		this.model.save({ datePublished: new Date() }, { patch: true, wait: true });
	},

	initialize: function(options) {
		this.listenTo(this.model, 'sync', this.render);

		this.listenTo(this.model, 'destroy', this.remove);
	},

	template: 'admin/models/field',
});
