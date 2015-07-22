module.exports = {
	events: {
		'submit form': 'login',
		'click button.social': 'socialLogin',
		'click a': 'remove'
	},

	initialize: function(options) {
		if(options.el && options.el.firstChild)
			this.attach();
	},

	attach: function() {
		var $form = this.$('form');

		var $validator = $form.validate({
			messages: {
				email: {
					required: 'Ange din epostadress',
					email: 'Inte en giltig epostadress',
				},
				'password': {
					required: 'Ange ett lösenord'
				}
			},
		});

		if($.fn.placeholder)
			this.$('input').placeholder();
	},

	template: 'partials/login-form',

	onError: function(err) {
		var that = this;
		if(this.message) {
			this.message.remove();
		}

		this.message = new this.app.views.Message({
			//animateHeight: true,
			data: { 
				type: 'error',
				heading: err.status === 401 ? 'Inloggninsfel' : 'Oops',
				body: err.message
			}
		});

		this.message.render(function() {
			this.enter(that.el, 'prepend');
		});
	},

	login: function(e) {
		e.preventDefault();

		var view = this;

		$.ajax({
			method: 'POST',
			url: '/auth/local',
			data: $(e.currentTarget).JSONify(),
			dataType: 'json',
			success: function(user, statusText, xhr) {
				view.app.login(user);

				var redirect = xhr.getResponseHeader('Location');

				if(redirect) {
					if(/^\/admin/.test(redirect))
						return (window.location = redirect);

				} else 
					redirect = '/';
				
				view.app.router.navigate(redirect, true);
			},
			error: function(xhr, statusText, error) {
				view.onError(xhr.responseJSON);
			}
		});
	},

	socialLogin: function(e) {
		var _view = this;
		window.open($(e.target).data('href'), "_blank");
		this.listenToOnce(window.broadcast, 'authenticate', function(err, user) {
			if(err) return _view.onError(err);

			_view.app.login(user);
		});
	}
};
