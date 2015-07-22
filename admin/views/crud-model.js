module.exports = {
	extends: 'Model',

	attach: function() {
		var _view = this;

		_view.app.views.Model.prototype.attach.apply(_view, arguments);

		var $controls = _view.$('.controls');

		if($controls.length > 0) {
			_view.controls = new _view.app.views.ModelControls({ el: _view.$('.controls'), model: _view.model, collection: _view.collection, parent: _view });

			if(this.name !== 'Form')
				_view.$el.on('click', _view.controls.edit.bind(_view.controls));
		}
	},

	setModel: function() {
		var _view = this;

		_view.app.views.Model.prototype.setModel.apply(_view, arguments);


		if(_view.controls) {
			_view.controls.setModel(_view.model);//set model, do update since attach (currently) calls that
		}
	}
};
