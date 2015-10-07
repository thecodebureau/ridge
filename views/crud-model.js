var app = require('ridge');

module.exports = require('ridge/view').extend({
	events: {
		'click button,select,input': function(e) {
			e.stopPropagation();
		},
		'click button': function(e) {
			e.preventDefault();
		},
		'click button[data-command="publish"]': 'publish',
		'click button[data-command="unpublish"]': 'unpublish',
		'click button[data-command="delete"]': 'delete'
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

		this.listenTo(this.model, 'change:datePublished', function(model, value) {
			this.$el.toggleClass('published', !!value).toggleClass('unpublished', !value);
		});
	}
});
