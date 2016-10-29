

/* Base view */

import app from './ridge';

function createViews() {
  const self = this;

  return _.flatten(_.map(this.subviews, (subview, name) => {
    subview = parseSubview.call(self, subview);

    const Subview = subview.constructor;

    if (!Subview) return;

    if (!subview.multi) {
      // passing of falsy subview.el uses parent elements element, ie one
      // element gets more than one view
      subview.el = subview.el ? self.$(subview.el) : $(self.el);

      if (subview.el.length === 0) {
        return;
      }

      return (self[name] = new Subview(subview));
    }

    return (self[name] = _.map(self.$(subview.el), (el) => {
      subview.el = el;
      return new Subview(subview);
    }));
  }));
}

function parseSubview(subview) {
  const defaults = {
    collection: this.collection,
    model: this.model,
    state: this.state,
    data: this.data,
  };

  if (_.isArray(subview)) {
    subview = _.extend({
      el: subview[0],
      constructor: subview[1],
    }, subview[2]);
  }

  subview.parent = this;
  // subview.name = name;

  if (!subview.prepareView) {
    _.defaults(subview, defaults);
  }

  return subview;
}

function getElements(view) {
  return _.mapValues(view.elements, (selector) => {
    selector = _.isString(selector) ? selector : selector.selector;

    return view.$(selector);
  });
}

const View = Backbone.View.extend({
  constructor(options, ...args) {
    _.extend(this, _.pick(options, 'template', 'parent', 'bindings', 'subviews', 'state', 'templateEngine', 'loadTemplate'));

    // we clone to prevent views referencing the same object
    this.data = options && options.data ? _.clone(options.data) : {};

    Backbone.View.call(this, options, ...args);

    if (this.rendering) return;

    this.rendered = (this.el && (this.el.children.length > 0 || !!this.el.textContent.trim()));

    if (!this.rendered) this.render();
    else this._attach();
  },

  render() {
    _.result(this, 'unobserve');

    const data = _.extend({}, app.context, _.result(this.state, 'toJSON'), this.data, _.result(this.model, 'toJSON'));

    this.renderTemplate(data);

    return this;
  },

  // Render Dust template and update element, using the fx queue

  renderTemplate(data) {
    const result = this.template(data);

    this.updateElement(result);

    this._attach();

    this.rendered = true;

    return this;
  },

  updateElement(newEl) {
    if (typeof newEl === 'string') {
      newEl = $(newEl)[0];
    }

    this.$el.empty();
    this.$el.append(newEl.childNodes);

    _.forEach(newEl.attributes, (node) => {
      this.$el.attr(node.nodeName, node.value);
    });

    // remove old subviews
    _.invokeMap(this.views, 'remove');
  },


  _attach() {
    this._subviews = createViews.call(this);
    this.elements = getElements(this);
    if (this.attach) this.attach();
  },

  // animated enter
  enter(...args) {
    this.$el.enter(...args);
    return this;
  },

  preventDefault(e) {
    e.preventDefault();
  },

  toggle(options) {
    this.$el.toggle(options);
    return this;
  },

  remove() {
    _.invokeMap(this._subviews, 'remove');

    this._removeElement();
    this.stopListening();
    return this;
  },

  // animated remove
  leave(options) {
    this.stopListening();

    let subViews = this.views;

    while (subViews && subViews.length > 0) {
      _.invokeMap(subViews, 'stopListening');

      subViews = _.compact(_.flatten(_.map(subViews, 'views')));
    }

    this.$el.leave(options, this.remove.bind(this));

    return this;
  },
});

View.prototype._remove = View.prototype.remove;
View.prototype._stopListening = View.prototype.stopListening;
View.prototype._render = View.prototype.render;

export default View;
