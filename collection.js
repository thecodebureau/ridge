module.exports = Backbone.Collection.extend({
  constructor: function(attributes, options) {
    Backbone.Collection.apply(this, arguments);

    if(this.model === Backbone.Model) 
      this.model = require('ridge/model');

    return this;
  },

  parse: function(resp) {
    if(_.isPlainObject(resp)) {
      _.extend(this, _.pick(resp, 'totalCount', 'perPage'));

      return _.find(resp, _.isArray);
    }

    return resp;
  }
});
