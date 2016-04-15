var Router = require('./router');

var app = module.exports = _.create(Backbone.View.prototype, {
	el: document.documentElement,

	events: {
		'click a[href]:not([target])': function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which == 2 || e.button == 2 || e.isDefaultPrevented())
				return;

			var href = e.currentTarget.href,
				root = location.protocol + '//' + location.host + Backbone.history.root,
				index = root.length - 1;

			// if the URL matches the root
			if (href.slice(0, index) + '/' == root) {
				e.preventDefault();
				// navigate to URL fragment without the root
				app.router.navigate(href.slice(index), { trigger: true });
			}
		}
	},

	extend: function() {
		_.each(arguments, function(arg) {
			_.each(arg, function(value, key) {
				app[key] = typeof value == 'object' && /s$/.test(key) ?
					_.extend(app[key] || {}, value) : value;
			});
		});

		return app;
	},

	start: function(options) {
		app.elements = { main: $('main') };

		app.router = new Router({
			routes: this.routes,
			reload: true
		});

		app.router.states.reset(options.states, { parse: true });

		app.router.states.on('enter', app.createPage);
		app.router.states.pending = options;

		Backbone.history.start(options);

		// prevent scrolling on popState with { scrollRestoration: 'manual' }
		if(window.history.scrollRestoration)
			_.extend(window.history, _.pick(options, 'scrollRestoration'));

		Backbone.View.call(app);
	},

	createPage: function(options) {
		var PageView = options && options.view;

		var page = new PageView(options);

		if(!(page.el.parentNode instanceof Element))
			app.switchPage(page, options);
		else
			app.currentPage = page;
	},

	switchPage: function(page, options) {
		if(app.currentPage)
			app.currentPage.remove();
		
		(app.currentPage = page).$el.appendTo(app.elements.main);
	},

	remember: function(state) {
		if (Backbone.history._usePushState)
			window.history.replaceState(_.extend({}, window.history.state, state), document.title);
	}
});
