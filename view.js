'use strict';

/* Base view */

var app = require('./ridge'),
  Promise = require('./util/promise'),
  tagPattern = /<(\w+)[^>]*>/,
  attrPattern = /\s+(\S+)\s*=\s*("[^"]*"|'[^']*')/g;


/* Extract wrapping element, attributes and contents */
function parseElement(html, callback) {
  var m = html.match(tagPattern);    // match first start tag

  if (m) {
    var tag = m[0],
      tagName = m[1],
      endTag = '</' + tagName + '>',
      endIndex = html.lastIndexOf('</');

    // check that the last end matches the start tag
    // and that there is no content after it

    if (html.slice(endIndex).replace(/\s+/g, '') === endTag)
      return callback(html.slice(m.index + tag.length, endIndex), tag, endTag, tagName);
  }

  return callback(html);
}

function attributes(tag) {    // extract attributes from tag string
  var attrs = {},
    m;

  while (m = attrPattern.exec(tag))
    attrs[m[1]] = m[2].slice(1, -1);

  return attrs;
}


function createViews() {
  var self = this;

  return _.flatten(_.map(this.subviews, function (subview, name) {
    subview = parseSubview.call(self, subview);

    var Subview = subview.constructor;

    if (!Subview) return;

    if (!subview.multi) {
      // passing of falsy subview.el uses parent elements element, ie one
      // element gets more than one view
      subview.el = subview.el ? self.$(subview.el) : $(self.el);

      if (subview.el.length === 0)
        return;

      return (self[name] = new Subview(subview));
    }

    return (self[name] = _.map(self.$(subview.el), function (el) {
      subview.el = el;
      return new Subview(subview);
    }));
  }));
}

function parseSubview(subview) {
  var defaults = {
    collection: this.collection,
    model: this.model,
    state: this.state,
    data: this.data
  };

  if (_.isArray(subview)) {
    subview = _.extend({
      el: subview[0],
      constructor: subview[1],
    }, subview[2]);
  }

  subview.parent = this;
  //subview.name = name;

  if (!subview.prepareView)
    _.defaults(subview, defaults);

  return subview;
}

function getElements(view) {
  return _.mapValues(view.elements, function (selector, name) {
    selector = _.isString(selector) ? selector : selector.selector;

    return view.$(selector);
  });
}

var View = Backbone.View.extend({
  // Promise factory function using view as the context with callbacks
  Promise: function (resolver) {
    var context = this;
    return new Promise(function (resolveWith) {
      resolveWith(context, null, resolver, context);
    });
  },

  constructor: function (options) {
    _.extend(this, _.pick(options, 'template', 'parent', 'bindings', 'subviews', 'state', 'templateEngine', 'loadTemplate'));

    // we clone to prevent views referencing the same object
    this.data = options && options.data ? _.clone(options.data) : {};

    Backbone.View.apply(this, arguments);

    if (this.rendering) return;

    this.rendered = (this.el && (this.el.children.length > 0 || !!this.el.textContent.trim()));

    if (!this.rendered) this.render();
    else this._attach();
  },

  render: function () {
    _.result(this, 'unobserve');

    var data = _.extend({}, app.context, _.result(this.state, 'toJSON'), this.data, _.result(this.model, 'toJSON'));

    this.renderTemplate(data);

    return this;
  },

  // Render Dust template and update element, using the fx queue

  renderTemplate: function (data) {
    var result = this.template(data);

    this.updateElement(result);

    this._attach();

    this.rendered = true;

    return this;
  },

  updateElement: function (newEl) {
    if (typeof newEl === 'string') {
      newEl = $(newEl)[0];
    }

    this.$el.empty();
    this.$el.append(newEl.childNodes);

    _.forEach(newEl.attributes, function (node) {
      this.$el.attr(node.nodeName, node.value);
    }.bind(this));

    // remove old subviews
    _.invokeMap(this.views, 'remove');
  },


  _attach: function () {
    this._subviews = createViews.call(this);
    this.elements = getElements(this);
    if (this.attach) this.attach();
  },

  // animated enter
  enter: function () {
    this.$el.enter.apply(this.$el, arguments);
    return this;
  },

  preventDefault: function (e) {
    e.preventDefault();
  },

  toggle: function (options) {
    this.$el.toggle(options);
    return this;
  },

  remove: function () {
    _.invokeMap(this._subviews, 'remove');

    this._removeElement();
    this.stopListening();
    return this;
  },

  // animated remove
  leave: function (options) {
    this.stopListening();

    var subViews = this.views;

    while (subViews && subViews.length > 0) {
      _.invokeMap(subViews, 'stopListening');

      subViews = _.compact(_.flatten(_.map(subViews, 'views')));
    }

    this.$el.leave(options, this.remove.bind(this));

    return this;
  }
});

View.prototype._remove = View.prototype.remove;
View.prototype._stopListening = View.prototype.stopListening;
View.prototype._render = View.prototype.render;

module.exports = View;
