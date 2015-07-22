module.exports = {
	attach: function() {
		var collectionName = this.$el.data('collection');

		this.collection = new this.app.collections[collectionName]();

		this.formView = new this.app.views.Form({
			el: this.$('.form'),
			template: 'admin/models/' + this.collection.modelName.toSpinalCase() + '-form',
			collection: this.collection
		});

		this.collectionView = new this.app.views.CrudCollection({
			el: this.$('.collection'),
			template: 'admin/models/' + this.collection.name.toSpinalCase(),
			collection: this.collection
		});
	}
};
