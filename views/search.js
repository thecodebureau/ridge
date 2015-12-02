
var _filters = {
	dot: function(value, key) {
		// <select name="status" data-dot><option value="paid,false">Unpaid</option></select>
		var arr = value.split(',');
		name = name + '.' + arr[0];
		value = arr[1];
	},

	regex: function(flags) {
		return function(value, key) {
			return '/' + value + '/' + flags;
		};
	}
};

var app = require('ridge');

var FormView = require('ridge/views/form');

module.exports = FormView.extend({
	submit: function(e) {
		e.preventDefault();

		var query = [];

		_.each(this.$el.prop('elements'), function(elem) {
			if (elem.name && elem.value)
				query.push(encodeURIComponent(elem.name) + '=' + encodeURIComponent(elem.value).replace('%20', '+'));
		});

		var url = '/' + Backbone.history.fragment.split('?')[0];

		if (query.length) url += '?' + query.join('&');

		Backbone.history.navigate(url, { trigger: true });
	},

	initialize: function() {
		this.listenTo(app.router.current(), 'change:query', this.setQuery);

		this.delegate('submit', this.submit.bind(this));
	},

	attach: function() {
		this.setQuery();
	},

	setQuery: function() {
		var params = app.router.params;

		_.each(this.$el.prop('elements'), function(elem) {
			if (elem.name)
				$(elem).val(params[elem.name]).trigger('change');
		});
	}
});
