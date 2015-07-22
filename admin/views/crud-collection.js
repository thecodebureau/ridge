module.exports = {
	extends: 'Collection',

	initialize: function() {
		this.DefaultModelView = this.app.views.CrudModel;

		this.app.views.Collection.prototype.initialize.apply(this, arguments);
	},

	create: function(item) {
		// chrome datetime-local gives a string like: YYYY-MM-DDTHH:MM,
		// which the Date constructor interprets as an ISO date string,
		// and iso date string are always saved in UTC time. Remove the T
		// and it will save the time in localtime.
		this.collection.add(item);
		item.save();
	},
};
