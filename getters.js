
function html(el) {
	return $(el).html();
}

html.events = [ 'change', 'input' ];

function value(el) {
	var $el = $(el);

	if($el.length === 1) {
		if((/checkbox/i).test($el[0].type))
			return $el.is(':checked');

		return $el.val();
	} else {
		if((/radio/i).test($el[0].type)) {
			return $el.filter(':checked').val();
		} else {
			if((/checkbox/i).test($el[0].type))
				$el = $el.filter(':checked');
		
			var arr = $el.toArray().map(function(element) {
				return $(element).val();
			});

			return arr.length > 0 ? arr : null;
		}
	}
}

value.events = [ 'input', 'change', 'blur' ];

module.exports = {
	html: html,

	value: value,

	parts: function(value) {
		var parts = $(this).find('[data-part]').toArray();
		// if the property is in "parts" we need to collect vales from all
		// the parts (elements). return if not all parts are set
		if(_.some(parts, function(el) { 
			return !($(el).val() || $(el).html()); 
		}))
			return null;
		else
			return parts.map(function(el) { return ($(el).val() || $(el).html()); }).join(' ').trim();
	},

	src: function(value) {
		return $(this).attr('src');
	},

	selectMultiple: function(value) {
		return $(this.val());
	}
};
