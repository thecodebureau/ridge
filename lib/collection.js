module.exports = Backbone.Collection.extend({
	constructor: function(attributes) {
		Backbone.Collection.apply(this, arguments);

		if(_.isString(this.model)) {
			console.log('fixing model');
			this.model = this.models[this.model];
		}

		return this;
	}
});
