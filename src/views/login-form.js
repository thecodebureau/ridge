import Model from '../model';
import ValidateMixin from '../mixins/validate';

import MessageView from './message';
import FormView from './form-styling';

import app from '../ridge';

import View from '../view';

const LoginFormView = View.extend();
const LoginFormModel = Model.extend();

_.extend(LoginFormModel.prototype, ValidateMixin, {
  urlRoot: '/auth/local',

  validation: {
    email: {
      email: true,
      required: true,
    },
    password: {
      required: true,
    },
  },
});


_.extend(LoginFormView.prototype, require('../mixins/observe'), {
  template: 'partials/login-form',

  events: {
    'click a.external': 'externalLogin',
    'click .close': 'close',
    'submit form': 'save',
  },

  subviews: {
    form: ['form', FormView],
  },

  elements: {
    button: 'button',
    form: 'form',
  },

  initialize(opts) {
    if (opts && opts.removeOnLogin) {
      this.listenTo(app, 'login', this.remove);
    }

    this.model = opts && opts.model || new Model();

    this.bindings = _.mapValues(this.model.validation, (value, key) => {
      const binding = {};

      binding[`[name="${key}"],[data-name="${key}"]`] = {
        both: 'value',
      };

      return binding;
    });
  },

  error(model, xhr) {
    if (this.message) {
      this.message.leave({ animateHeight: true });
    }

    const resp = xhr.responseJSON;

    this.message = new MessageView({
      message: {
        type: 'error',
        heading: resp.statusText,
        body: resp.message,
      },
    }).enter(this.elements.form, { method: 'prepend', animateHeight: true });
  },

  save(e) {
    e.preventDefault();

    if (this.model.isValid()) {
      $(document.body).addClass('progress');

      this.elements.button.prop('disabled', true);

      this.model.save(null, {
        error: this.error,
        success: this.success,
        complete: this.complete,
        context: this,
        validate: false,
      });
    }
  },

  complete() {
    this.elements.button.prop('disabled', false);

    $(document.body).removeClass('progress');
  },

  success(model, resp, options) {
    model.reset({ silent: true });

    app.login(resp, options.xhr.getResponseHeader('location'));
  },

  attach() {
    this.observe({ validate: true });
  },

  externalLogin(e) {
    e.preventDefault();

    const _view = this;
    const newWindow = window.open(`${$(e.currentTarget).attr('href')}?loginWindow=true`, 'name', 'height=600,width=450');

    if (window.focus) {
      newWindow.focus();
    }

    this.listenToOnce(window.broadcast, 'authenticate', (err, user, newUser, redirect) => {
      if (err) {
        if (_view.message) {
          _view.message.leave({ animateHeight: true });
        }

        _view.message = new app.views.Message({
          animateHeight: true,
          message: {
            type: 'error',
            heading: err.statusText,
            body: err.message,
          },
        }).enter(e.currentTarget, 'before', true);
      } else {
        app.login(user, redirect);
      }
    });
  },
});

export default LoginFormView;
