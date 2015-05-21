module.exports = Backbone.Collection.extend({
	constructor: function(attributes) {
		Backbone.Collection.apply(this, arguments);

		if(_.isString(this.model)) {
			if(this.modelClasses[this.model])
				this.model = this.modelClasses[this.model];
			else {
				this.model = this.modelClasses.Model.extend({
					name: this.model
				});
			}
		}

		this.modelName = this.model.prototype.name;

		return this;
	}
});
