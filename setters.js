module.exports = {
	html: function(el, value, previousValue) {
		$(el).html(value);
	},

	value: function(el, value, previousValue) {
		var $el = $(el);

		if($el[0].type === 'radio' || $el[0].type === 'checkbox') {
			$el.prop('checked', false);

			if(value)
				$el.filter((_.isArray(value) ? value : [ value ]).map(function(value) {
					return '[value="' + value + '"]';
				}).join(',')).prop('checked', true);
		} else {
			if(value != null) value = value.toString();

			$(el).val(value);
		}
	},

	published: function(el, value) {
		$el = $(this).closest('[data-published]');

		$el.attr('data-published', (!!value).toString());
	},

	parts: function(el, value) {
		if(!_.isDate(value)) ref = new Date(value);

		ref = ref.toLocaleString('se-SV').split(' ');

		$(el).find('[data-part]').toArray().forEach(function(part, index) {
			$(part).val(ref[index]);
		});
	},

	src: function(el, value) {
		$(el).attr('src', value);
	},

	selectMultiple: function(el, value) {
		if(!value) $(el).val(null);
		else
			value.forEach(function(value) {
				$(el).find('[value="' + value + '"]').prop('selected', true);
			});
	}
};
