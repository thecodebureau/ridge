var Model = require('ridge/model').extend();

_.extend(Model.prototype, require('ridge/mixins/validate'), {
  urlRoot: '/auth/local',

  validation: {
    email: {
      email: true,
      required: true
    },
    password: {
      required: true
    }
  }
});

var MessageView = require('ridge/views/message');
var FormView = require('ridge/views/form-styling');

var app = require('ridge');

var View = require('ridge/view').extend();

_.extend(View.prototype, require('ridge/mixins/observe'), {
  template: 'partials/login-form',

  events: {
    'click a.external': 'externalLogin',
    'click .close': 'close',
    'submit form': 'save'
  },

  subviews: {
    form: [ 'form', FormView ]
  },

  elements: {
    button: 'button',
    form: 'form'
  },

  initialize: function(opts) {
    if(opts && opts.removeOnLogin)
      this.listenTo(app, 'login', this.remove);

    this.model = opts && opts.model || new Model();

    this.bindings = _.mapValues(this.model.validation, function(value, key) {
      var binding = {};

      binding['[name="' + key + '"],[data-name="' + key + '"]'] = {
        both: 'value',
      };

      return binding;
    });
  },

  error: function(model, xhr, options) {
    _.result(this.message, 'remove');

    var resp = xhr.responseJSON;

    this.message = new MessageView({
      message: { 
        type: 'error',
        heading: resp.statusText,
        body: resp.message
      }
    }).enter(this.elements.form, { method: 'prepend' });
  },

  save: function(e) {
    e.preventDefault();

    if(this.model.isValid()) {
      $(document.body).addClass('progress');

      this.elements.button.prop('disabled', true);

      this.model.save(null, {
        error: this.error,
        success: this.success,
        complete: this.complete,
        context: this,
        validate: false
      });
    }
  },

  complete: function() {
    this.elements.button.prop('disabled', false);

    $(document.body).removeClass('progress');
  },

  success: function(model, resp, options) {
    model.reset({ silent: true });

    app.login(resp, options.xhr.getResponseHeader('location'));
  },

  attach: function() {
    this.observe({ validate: true });
  },

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

module.exports = View;
