module.exports = {
	events: {
		'submit': 'filter'
	},

	attach: function() {
		var _view = this;

		_view.regex = [];

		this.$('input[data-regex]').each(function() {

			_view.regex.push({
				el: this,
				namespace: this.name.split('.').map(function(value) {
					return value.split(':').join('.');
				}),
				flags: $(this).data('flags') || ''
			});
		});
	},

	filter: function(e) {
		var _view = this;
		e.preventDefault();

		var filter = $(e.currentTarget).JSONify();

		_view.regex.forEach(function(obj) {
			if(!obj.el.value) return;

			for(var i = 0, ref = filter; i < obj.namespace.length - 1; i++) {
				ref = ref[obj.namespace[i]];
			}

			ref[obj.namespace[i]] =  '/' + obj.el.value + '/' + obj.flags;
		});

		_view.collection.setFilter(filter);

		_view.collection.fetch({ reset: true });
	}
};
