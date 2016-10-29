window.broadcast = _.extend({}, Backbone.Events);

export default {
  events: {
    'click a.login': 'toggleLoginForm',
    'click a.logout': 'logout',
  },

  toggleLoginForm(e) {
    if (e) e.preventDefault();

    if (this.loginForm) {
      this.loginForm.remove();
      delete this.loginForm;
    } else {
      this.loginForm = new this.views.LoginForm({ removeOnLogin: true }).enter(document.body);
    }
  },

  login(user, loadUrl) {
    this.user = new Backbone.Model(user);

    if (this.loginForm && this.toggleLoginForm) {
      this.toggleLoginForm();
    }

    if (loadUrl) {
      if (/^\/admin/.test(loadUrl)) {
        window.location.replace(loadUrl);
      } else {
        Backbone.history.navigate(loadUrl, { trigger: true });
      }
    } else {
      // Backbone.history.loadUrl is called by Backbone.history.navigate when trigger: true
      loadUrl = Backbone.history.fragment;

      if (loadUrl === 'login') {
        Backbone.history.navigate('', { trigger: true });
      } else {
        Backbone.history.loadUrl(loadUrl);
      }
    }

    this.trigger('login', this.user);
  },

  logout(e) {
    e.preventDefault();

    $.ajax({
      url: '/auth/logout',
      dataType: 'json',
      success() {
        window.location.replace('/');
      },
      error(res, statusText, error) {
        // TODO
        console.error(error);
      },
    });
  },
};
