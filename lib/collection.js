module.exports = Backbone.Collection.extend({
	constructor: function(attributes) {
		Backbone.Collection.apply(this, arguments);

		if(_.isString(this.model)) {
			this.model = this.modelClasses[this.model];
		}

		this.modelName = this.model.prototype.name;

		return this;
	}
});
