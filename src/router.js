'use strict';

var Router = Backbone.Router,
  route = Router.prototype.route;

// Parse query string into an object.
// Understands array values serialized by jQuery.param() without nesting.
//
//  'a=1&a=2&b[]=3&c=' ->
//  { a: ['1', '2'], b: ['3'], c: '' }
//
function parseQueryString(query) {
  var result = {};

  _.each(query.replace(/\+/g, ' ').split('&'), function (key) {
    var index = key.indexOf('='),
      val = '';

    if (index >= 0) {
      val = decodeURIComponent(key.slice(index + 1));
      key = key.slice(0, index);
    }
    if (!key) return;

    key = decodeURIComponent(key);

    // brackets notation for array value
    if (key.slice(-2) == '[]') {
      key = key.slice(0, -2);
      val = [val];
    }

    // if there are multiple values per key, concatenate
    result[key] = _.has(result, key) ? [].concat(result[key], val) : val;
  });

  return result;
}

module.exports = Router.extend({
  // application states shared by router instances
  states: new Backbone.Collection(null, {
    model: Backbone.Model.extend({
      // should contain defaults for attributes saved in history.state
      defaults: {
        scrollTop: null
      },

      initialize: function (attrs, options) {
        var now = (this.created = new Date()).getTime();

        if (options && typeof options.maxage === 'number')
          (this.expires = new Date()).setTime(now + options.maxage);
      },

      url: function () {
        var path = this.get('path');
        return path && path + (this.get('search') || '');
      },

      parse: function (resp) {
        return _.has(resp, 'data') ? resp.data : _.omit(resp, 'compiled', 'navigation', 'site');
      },

      // make this the active state.
      // triggers enter event if state was inactive
      enter: function (opts) {
        this.loading = false;
        if (!this.active) {
          this.active = true;
          this.trigger('enter', opts);
        }
      },

      // make this state inactive.
      // triggers leave event if state was active
      leave: function (opts) {
        if (this.loading === true)
          this.loading = false;

        if (this.active) {
          this.active = false;
          this.trigger('leave', opts);
        }
      }
    })
  }),

  constructor: function (options) {
    this.options = _.omit(options, 'routes');
    Router.apply(this, arguments);
  },

  // creates router if given options object as argument
  route: function(path, name, callback) {
    var router = this,
      root = router.options.root;

    if (_.isString(path)) {
      if (root) path = root + path;
      if (path) root = (path + '/').replace(/\/+$/, '/');
    }

    if (name && typeof name == 'object') {
      router = name instanceof Router ? name :
        new this.constructor(_.extend({ root: root }, name));
      name = '';
    }
    return route.call(router, path, name, callback);
  },

  // update the URL by appending fragment to this.options.root
  navigate: function(fragment, options) {
    var url = this.url(fragment);

    if (options === true) options = { trigger: true };

    if (options && options.trigger && !options.replace)
      this.remember(this.scrollState());

    this.states.pending = options;
    // ignoring url.hash for now
    Backbone.history.navigate(url.path + url.search, options);
    this.states.pending = false;
    return this;
  },

  execute: function (callback, args) {
    var query = args.pop();

    if (_.isString(query))
      query = parseQueryString(query);

    args.push(query);

    if (callback) callback.apply(this, args);

    // get options from states.pending.
    // allows us to get options passed to navigate
    var states = this.states,
      options = states.pending;
    states.pending = false;

    // attributes to set on state model
    var state = _.extend({ query: query }, window.history.state);
    state = this.load(null, state, options);

    this.transitionTo(state, options);
  },

  // add and fetch new state or update existing state
  load: function (fragment, attrs, opts) {
    var states = this.states,
      state,
      history = Backbone.history;

    if (fragment == null) {
      fragment = history.fragment;
    }

    var url = this.url(fragment, history.root);

    attrs = _.defaults(_.pick(url, 'path', 'search'), attrs);
    attrs.id = fragment;

    opts = _.extend({}, this.options, opts);
    // make sure data passed to fetch is either empty or set to query
    opts.data = opts.url && url.query;

    // get router state or get state by fragment or get initial state
    state = !opts.reload && states.get(this) ||
      states.get(attrs) ||
      states.get(history.decodeFragment((opts.url || url.path) + url.search));

    if (state) {
      // remove stale state
      if (opts.trigger && state.expires && state.expires < new Date() &&
          !state.loading && state !== states.current)
        states.remove(state, opts);
      else
        return state.set(_.defaults(attrs, _.result(state, 'defaults')), opts);
    }

    state = states.add(attrs, opts);
    if (opts.fetch !== false)
      state.loading = state.fetch(opts);

    return state;
  },

  // update the current state and trigger transition events.
  // The leave event is triggered immediately on the previous state.
  // The enter event is then triggered asynchronously.
  transitionTo: function (state, opts) {
    // save state on router
    this.cid = state.cid;

    var states = this.states,
      previous = states.current;

    states.current = state;

    if (state !== previous) {
      if (previous) previous.leave(opts || {});

      // options to pass along with enter event
      opts = _.extend({ state: state, router: this }, this.options, opts);

      state.loading = state.loading || true;

      // allow route event handlers to execute before triggering enter
      setTimeout(enter, 0);
    }

    function enter() {
      var loading = state.loading;

      if (loading === true) state.enter(opts);
      else if (loading) {
        // provide xhr object to enter event handlers
        opts.xhr = loading;
        loading.options = opts;
        loading.always(function () {
          // make sure transition has not been aborted
          if (state === states.current)
            // make sure we use options from the latest transition
            state.enter(loading.options);
        });
      }
    }
  },

  // generate URL from decoded fragment by appending it to root.
  // using root prefix from router options by default.
  // root should end with a slash
  url: function (fragment, root) {
    fragment = (fragment || '').split('#');

    if (root == null)
      root = this.options.root || '';

    var url = encodeURI(fragment[0]).replace(/%25/g, '%'),
      path = url.replace(/\?.*/, ''),
      search = url.slice(path.length);

    fragment[0] = '';

    return {
      // remove trailing slash on the root
      path: !path && root.slice(0, -1) || root + path,
      query: search.slice(1),
      search: search,
      hash: fragment.join('#')
    };
  },

  // returns scroll position that should be saved
  scrollState: function () {
    return { scrollTop: window.pageYOffset };
  },

  // update history.state.
  // sets attributes on the current active state
  remember: function (attrs, options) {
    var current = this.states.current;
    if (current && current.active) {
      current.set(attrs, options);
      if (Backbone.history._usePushState)
        window.history.replaceState(_.extend({}, window.history.state, attrs), document.title);
    }
  }
});
