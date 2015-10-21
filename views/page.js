var app = require('../ridge'),
	View = require('../view');

module.exports = View.extend({
	constructor: function(options) {
		if (options) {
			var viewName = options.el instanceof $ ? options.el.data('view') :
				_.defaults(options, options.model && options.model.get('page')).view;

			if (viewName)
				return new app.views[viewName](options);
		}

		View.call(this, options);
	},

	attach: function() {
		var _view = this;
		
		_view.views = _.compact(_view.$('[data-view]').toArray().map(function(el) {
			var View = app.views[$(el).data('view')];

			return View ? new View({ el: el, data: _view.data }) : null;
		}));
	}
});
