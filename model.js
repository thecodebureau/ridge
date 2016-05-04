'use strict';

var flatten = require('./util/flatten');

module.exports = Backbone.Model.extend({
  constructor: function (attrs, opts) {
    Backbone.Model.apply(this, arguments);

    var self = this;

    this.originalAttributes = _.cloneDeep(this.attributes);

    this.on('sync', function () {
      self.originalAttributes = _.cloneDeep(this.attributes);
    });

    _.extend(this, _.pick(opts, 'validation'));
  },

  get: function (attr) {
    return _.get(this.attributes, attr);
  },

  idAttribute: '_id',

  isDirty: function () {
    return !_.isEqual(this.attributes, this.originalAttributes);
  },

  set: function (key, val, options) {
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;
    if (typeof key === 'object') {
      attrs = key;

      // fix so one can pass attrs object to unset
      if (typeof options !== 'object')
        options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    if (options.flatten)
      attrs = flatten(attrs);

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    var unset      = options.unset;
    var silent     = options.silent;
    var changes    = [];
    var changing   = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes);
      this.changed = {};
    }

    var current = this.attributes;
    var changed = this.changed;
    var prev = this._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for (var attr in attrs) {
      val = attrs[attr];

      if (!_.isEqual(_.get(current, attr), val)) changes.push(attr);

      if (!_.isEqual(_.get(prev, attr), val)) {
        changed[attr] = val;
      } else {
        delete changed[attr];
      }

      _.set(this.attributes, attr, val);
    }

    // Update the `id`.
    this.id = this.get(this.idAttribute);

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = options;
      for (var i = 0; i < changes.length; i++) {
        this.trigger('change:' + changes[i], this, _.get(current, changes[i]), options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        options = this._pending;
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  },


  // reset a model to latest synced state, or to default values
  // if model has not been persisted to server
  reset: function (options) {
    // TODO copy back victors version, stop emitting reset event and update set to remove properties if { unset: true }
    options = _.extend({ reset: true }, options);

    var set = flatten(this.originalAttributes),
      unset = _.omit(flatten(this.attributes), _.keys(set));

    var result = this.unset(unset, options);

    result = this.set(set, options);

    if (result && !(options && options.silent))
      this.trigger('reset');

    return result;
  },
});
