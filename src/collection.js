import Model from './model';

export default Backbone.Collection.extend({
  constructor(...args) {
    Backbone.Collection.apply(this, args);

    if (this.model === Backbone.Model) {
      this.model = Model;
    }

    return this;
  },

  parse(resp) {
    if (_.isPlainObject(resp)) {
      _.extend(this, _.pick(resp, 'totalCount', 'perPage'));

      return _.find(resp, _.isArray);
    }

    return resp;
  },
});
