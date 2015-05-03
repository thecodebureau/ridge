module.exports = {
	initialize: function(options) {
		if(!this.collection && options.collectionName)
			this.collection = new this.app.collections[options.collectionName]();

		this.collection.fetch({reset: true});

		this.listenTo(this.collection, 'add', this.add);
		this.listenTo(this.collection, 'reset', this.reset);
	},

	create: function(item) {
		// chrome datetime-local gives a string like: YYYY-MM-DDTHH:MM,
		// which the Date constructor interprets as an ISO date string,
		// and iso date string are always saved in UTC time. Remove the T
		// and it will save the time in localtime.
		this.collection.add(item);
		item.save();
	},

	reset: function() {
		console.log('reset');
		this.collection.each(function(item) {
			this.add(item);
		}, this);
	},

	add: function(item, reset) {
		var parentView = this;

		var itemView = new this.app.views[this.collection.name.toPascalCase()]({model: item});
		itemView.render(function() {
			parentView.$el[ reset === true ? 'append' : 'prepend' ](this.el);
		});
	}
};
