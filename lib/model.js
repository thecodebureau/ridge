module.exports = Backbone.Model.extend({
	constructor: function(attributes) {
		Backbone.Model.apply(this, arguments);

		this.on('sync', this.setOriginalAttributes);

		//if(attributes && attributes._id) 
			this.setOriginalAttributes();

		return this;
	},

	setOriginalAttributes: function() {
		this.originalAttributes = _.clone(this.attributes);
	},

	isSynced: function() {
		function compare(obj1, obj2) {
			if(!_.isObject(obj1))
				return obj1 === obj2;

			if(_.keys(obj1).length !== _.keys(obj2).length)
				return false;

			for(var p in obj1) {
				if(obj1.hasOwnProperty(p) && (!obj2.hasOwnProperty(p) || !compare(obj1[p], obj2[p]))) {
					return false;
				}
			}
			return true;
		}

		return (this.originalAttributes && compare(this.originalAttributes, this.attributes));
		//return compare({ a: 'four', b: { c: 'hello', d: 'good' } },{ a: 'four', b: { c: 'h3ello', d: 'good' } });
	},

	isFetched: function() {

	}
});
