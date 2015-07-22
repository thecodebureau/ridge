module.exports = {
	events: {
		'change [type="file"]': 'changeImage',
		'click button[data-command="upload"]': 'upload'
	},

	initialize: function(options) {
	},

	attach: function() {
		this.property = this.$el.attr('property') || 'filename';
		this.elements = {
			$uploadButton: this.$('button[data-command="upload"]'),
			$fileInput: this.$('input[type="file"]'),
			$captionInput: this.$('input[property="caption"]'),
			$uploadFigure: this.$('.upload figure'),
			$currentFigure: this.$('.current figure')
		};

		this.convertElements();

		this.options = _.compact(this.$el.attr('data-options').split(',').map(function(val) {
			var arr = _.compact(val.split('='));
			return arr.length > 1 ? arr : null;
		}));
	},

	changeImage: function(e) {
		var view = this,
			reader = new FileReader();

		reader.onload = function(e) {
			var image = new Image();
			image.src = e.currentTarget.result;

			var caption = 'Width: ' + image.width + ' Height: ' + image.height + ' Ratio: ' + image.width / image.height;

			view.elements.$uploadFigure
				.children().remove()
				.end().prepend(image)
				.append($('<figcaption>').text(caption));

			view.elements.$uploadButton.prop('disabled', false);
		};

		// Read in the image file as a data URL.
		reader.readAsDataURL(e.currentTarget.files[0]);
	},

	setModel: function(model) {
		var _view = this;

		_view.model = model;

		_view.elements.$uploadFigure.children().remove();
		_view.elements.fileInput.value = null;
		_view.elements.uploadButton.disabled = true;
		_view.elements.captionInput.disabled = false;
	},

	upload: function() {
		var view = this;

		var formData = new FormData();

		formData.append('image', this.elements.fileInput.files[0]);

		var urlEncoded = this.options.map(function(arr) {
			return arr.join('=');
		}).join('&');

		$.ajax({
			method: 'POST',
			url: '/admin/image-upload' + (urlEncoded ? '?' + urlEncoded : ''),
			data: formData,
			contentType: false,
			processData: false,
			success: function(res) {
				if(view.property !== 'filename')
					view.model.set('image', res.image);
				else 
					view.model.set(res.image);

				view.elements.fileInput.value = null;
				view.elements.uploadButton.disabled = true;
				view.elements.$uploadFigure.children().remove();
				view.elements.captionInput.disabled = false;
			},
			error: function(xhr, statusText, error) {

			}
		});
	}
};
