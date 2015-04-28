var View = require('./view');

module.exports = View.extend({
	events: {
		'click button.delete': 'delete',
		'click button.edit': 'edit',
	},
	
	initialize: function() {
		this.listenTo(this.model, 'sync', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
	},

	cancelEdit: function() {
		this.$el.removeClass('editing');
	},

	edit: function(e) {
		e.preventDefault();
		this.$el.siblings().removeClass('editing');
		this.listenToOnce(this.model, 'cancel', this.cancelEdit);
		this.$el.addClass('editing');
		app.trigger('edit:' + this.model.name, this.model);
	},

	delete: function(e) {
		if(confirm('Are you sure you want to delete the employee?')) {
			this.model.destroy();
			this.remove();
		}
	},
});
