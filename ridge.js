'use strict';

require('./util/dust-mod');

var dust = require('dustjs-linkedin');

var Router = require('./router');

var app = module.exports = _.create(Backbone.View.prototype, {
  dust: dust,

  helpers: dust.helpers,

  filters: dust.filters,

  el: document.documentElement,

  events: {
    'click a[href]:not([target])': function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2 || e.button === 2 || e.isDefaultPrevented())
        return;

      var href = e.currentTarget.href,
        root = location.protocol + '//' + location.host + Backbone.history.root,
        index = root.length - 1;

      // if the URL matches the root
      if (href.slice(0, index) + '/' === root && href.indexOf('#', index) < 0) {
        e.preventDefault();

        // navigate to URL fragment without the root
        app.router.navigate(href.slice(index), { trigger: true });
      }
    }
  },

  extend: function () {
    _.each(arguments, function (arg) {
      _.each(arg, function (value, key) {
        app[key] = typeof value === 'object' && /s$/.test(key) ?
          _.extend(app[key] || {}, value) : value;
      });
    });

    return app;
  },

  start: function (options) {
    app.elements = { main: $(options.main || 'main') };

    app.router = new Router({
      routes: this.routes,
      reload: true
    });

    app.router.states.reset(options.states, { parse: true });

    app.router.states.on({
      sync: app.loadTemplates,
      error: app.setError,
      enter: app.createPage
    }, app);

    if (!options.el && app.elements.main.children().length > 0)
      options.el = app.elements.main.children();

    app.router.states.pending = options;

    Backbone.history.start(options);

    // prevent scrolling on popState with { scrollRestoration: 'manual' }
    if (window.history && options && options.scrollRestoration) {
      window.history.scrollRestoration = options.scrollRestoration;

      window.onbeforeunload = function () {
        app.router.remember(app.router.scrollState());
      };
    }

    Backbone.View.call(app);
  },

  // on sync
  loadTemplates: function (state, resp) {
    _.each(resp && resp.compiled, dust.loadSource);
  },

  // on error
  setError: function (state, xhr, options) {
    state.set({
      page: { template: 'error' },
      error: _.extend(_.pick(xhr, 'status', 'statusText'), xhr.responseJSON)
    }, options);
    state.expires = new Date();
  },

  // on enter
  createPage: function (options) {
    var PageView = options && options.view;

    var page = new PageView(options);

    if (!(page.el.parentNode instanceof Element))
      app.switchPage(page, options);
    else {
      app.currentPage = page;

      _.invoke(page, 'scroll');
    }
  },

  switchPage: function (page, options) {
    if (app.currentPage)
      app.currentPage.remove();
 
    (app.currentPage = page).$el.appendTo(app.elements.main);
  },

  remember: function (state, options) {
    app.router.remember(state, options);
  }
});
