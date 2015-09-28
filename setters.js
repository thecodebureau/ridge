module.exports = {
	checkRadio: function(value) {
		if(!_.isArray(value))
			value = [ value ];

		var elements = _.isArray(this) ? this : [ this ];

		$(elements).prop('checked', false);

		value.forEach(function(value) {
			elements.forEach(function(element) {
				if(element.value === value)
					element.checked = true;
			});
		});
	},

	html: function(value) {
		$(this).html(value);
	},

	value: function(value) {
		$(this).val(value);
	},

	published: function(value) {
		$el = $(this).closest('[data-published]');

		$el.attr('data-published', (!!value).toString());
	},

	parts: function(value) {
		if(!_.isDate(value)) ref = new Date(value);

		ref = ref.toLocaleString('se-SV').split(' ');
		
		$(this).find('[data-part]').toArray().forEach(function(part, index) {
			$(part).val(ref[index]);
		});
	},

	src: function(value) {
		$(this).attr('src', value);
	},

	select: function(value) {
		var $el = $(this);

		if(value)
			$el.val(value);
		else
			$el.val($("> option:first-child", $el).val());
	},

	selectMultiple: function(value) {
		var _el = this;

		if(!value) $(this).val(null);
		else
			value.forEach(function(value) {
				var $el = $(_el).find('[value="' + value + '"]');
				
				$el.prop('selected', true);
			});
	}
};
