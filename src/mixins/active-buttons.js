const fncs = {
  cancel(el, model) {
    $(el)[model.isNew() || !model.collection ? 'hide' : 'show']().prop(this.disabled, false);
  },
  publish(el, model) {
    $(el)[!model.isNew() && !model.get('datePublished') ? 'show' : 'hide']().prop('disabled', model.isDirty());
  },
  unpublish(el, model) {
    $(el)[!model.isNew() && model.get('datePublished') ? 'show' : 'hide']().prop('disabled', model.isDirty());
  },
  delete(el, model) {
    el.disabled = model.isNew() || model.isDirty();
  },
  create(el, model) {
    $(el)[model.isNew() ? 'show' : 'hide']().prop('disabled', !model.isDirty());
  },
  save(el, model) {
    $(el)[!model.isNew() ? 'show' : 'hide']().prop('disabled', !model.isDirty());
  },
  reset(el, model) {
    $(el).prop('disabled', !model.isDirty());
  },
};

export default {
  setActiveButton() {
    const _view = this;

    _view.$('.controls button').each(function () {
      const command = $(this).data('command');

      if (fncs[command]) {
        fncs[command](this, _view.model);
      }
    });
  },
};

