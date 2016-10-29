import Router from './router';

const app = _.create(Backbone.View.prototype, {
  el: document.documentElement,

  events: {
    'click a[href]:not([target])': function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey
          || e.which === 2 || e.button === 2 || e.isDefaultPrevented()) {
        return;
      }

      const href = e.currentTarget.href;
      const root = `${location.protocol}//${location.host}${Backbone.history.root}`;
      const index = root.length - 1;

      // if the URL matches the root
      if (`${href.slice(0, index)}/` === root && href.indexOf('#', index) < 0) {
        e.preventDefault();

        // navigate to URL fragment without the root
        app.router.navigate(href.slice(index), { trigger: true });
      }
    },
  },

  extend(...args) {
    _.each(args, (arg) => {
      _.each(arg, (value, key) => {
        app[key] = typeof value === 'object' && /s$/.test(key) ?
          _.extend(app[key] || {}, value) : value;
      });
    });

    return app;
  },

  start(options) {
    app.elements = { main: $(options.main || 'main') };

    app.router = new Router({
      routes: this.routes,
      reload: true,
    });

    app.router.states.reset(options.states, { parse: true });

    app.router.states.on({
      sync: app.loadTemplates,
      error: app.setError,
      enter: app.createPage,
    }, app);

    if (!options.el && app.elements.main.children().length > 0) {
      options.el = app.elements.main.children();
    }

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

  // on error
  setError(state, xhr, options) {
    state.set({
      page: { template: 'error' },
      error: _.extend(_.pick(xhr, 'status', 'statusText'), xhr.responseJSON),
    }, options);
    state.expires = new Date();
  },

  // on enter
  createPage(options) {
    const PageView = options && options.view;

    const page = new PageView(options);

    if (!(page.el.parentNode instanceof Element)) {
      app.switchPage(page, options);
    } else {
      app.currentPage = page;

      _.invoke(page, 'scroll');
    }
  },

  switchPage(page) {
    if (app.currentPage) {
      app.currentPage.remove();
    }

    (app.currentPage = page).$el.appendTo(app.elements.main);
  },

  remember(state, options) {
    app.router.remember(state, options);
  },
});

export default app;
