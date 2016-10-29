var fncs = {
  cancel: function(el, model) {
    $(el)[model.isNew() || !model.collection ? 'hide' : 'show']().prop(this.disabled, false);
  },
  publish: function(model) {
    $(el)[!model.isNew() && !model.get('datePublished') ? 'show' : 'hide']().prop('disabled', model.isDirty());
  },
  unpublish: function(model) {
    $(el)[!model.isNew() && model.get('datePublished') ? 'show' : 'hide']().prop('disabled', model.isDirty());
  },
  delete: function(el, model) {
    el.disabled = model.isNew() || model.isDirty();
  },
  create: function(el, model) {
    $(el)[model.isNew() ? 'show' : 'hide']().prop('disabled', !model.isDirty());
  },
  save: function(el, model) {
    $(el)[!model.isNew() ? 'show' : 'hide']().prop('disabled', !model.isDirty());
  },
  reset: function(el, model) {
    $(el).prop('disabled', !model.isDirty());
  }
};

module.exports = {
  setActiveButtons: function() {
    var _view = this;

    _view.$('.controls button').each(function() {
      var command = $(this).data('command');

      if(fncs[command])
        fncs[command](this, _view.model);
    });
  }
};

