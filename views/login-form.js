var app = require('ridge');

module.exports = require('ridge/view').extend({
	events: {
		'click a.external': 'externalLogin'
	},

	initialize: function(opts) {
		if(opts && opts.removeOnLogin)
			this.listenTo(app, 'login', this.remove);

		this.model = new app.models.LoginUser();
	},

	attach: function() {
		var _view = this;

		if(this.formView) this.formView.remove();

		this.formView = new app.views.Form({
			el: this.$('form'),

			model: this.model,

			onError: function(model, xhr, options) {
				var _form = this,
					err = xhr.responseJSON;

				if(_form.message)
					_form.message.leave({ animateHeight: true });

				_form.message = new app.views.Message({
					message: { 
						type: 'error',
						heading: err.statusText,
						body: err.message
					}
				}).enter(_form.el, { method: 'prepend', animateHeight: true });
			},

			onSuccess: function(model, resp, options) {
				model.destroy();

				delete _view.model;

				app.login(resp, options.xhr.getResponseHeader('location'));
			},
		});
	},

	template: 'partials/login-form',

	externalLogin: function(e) {
		e.preventDefault();

		var _view = this,
			newWindow = window.open($(e.currentTarget).attr('href') + '?loginWindow=true', 'name', 'height=600,width=450');

		if (window.focus) {
			newWindow.focus();
		}

		this.listenToOnce(window.broadcast, 'authenticate', function(err, user, newUser, redirect) {
			if(err) {
				if(_view.message) 
					_view.message.leave({ animateHeight: true });

				_view.message = new app.views.Message({
					animateHeight: true,
					message: { 
						type: 'error',
						heading: err.statusText,
						body: err.message
					}
				}).enter(e.currentTarget, 'before', true);
					
			} else {
				app.login(user, redirect);
			}
		});
	}
});
