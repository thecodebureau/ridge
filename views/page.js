var app = require('ridge'),
	View = require('ridge/view');

module.exports = View.extend({
	tagName: 'section',

	className: 'page',

	constructor: function(options) {
		if(!this.template)
			this.template = options.template || options.state && options.state.get('page').template;

		View.call(this, options);
	}
});
