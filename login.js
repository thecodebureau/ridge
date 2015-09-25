window.broadcast = _.extend({}, Backbone.Events);

module.exports = {
	toggleLoginForm: function(e) {
		var app = this;
		if(e) e.preventDefault();

		if(app.loginForm) {
			app.loginForm.remove();
			delete app.loginForm;
		} else {
			app.loginForm = new app.views.LoginForm({ removeOnLogin: true }).enter(document.body);
		}
	},

	login: function(user, redirect) {
		this.user = new this.models.User(user);

		if(this.loginForm && this.toggleLoginForm) {
			this.toggleLoginForm();
		}

		if(redirect) {
			if(/^\/admin/.test(redirect))
				window.location.replace(redirect);
			else
				Backbone.history.navigate(redirect, { trigger: true });
		} else {
			// Backbone.history.loadUrl is called by Backbone.history.navigate when trigger: true
			Backbone.history.loadUrl(Backbone.history.fragment);
		}

		this.trigger('login');
	},

	logout: function(e) {
		var _app = this;
		e.preventDefault();
		$.ajax({
			url: '/auth/logout',
			dataType: 'json',
			success: function(res, statusText, xhr) {
				window.location.replace('/');
			},
			error: function(res, statusText, error) {
				// TODO
			}
		});
	}
};
