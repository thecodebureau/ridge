
function html(el) {
	return $(el).html();
}

html.events = [ 'blur', 'input', 'change' ];

function value(el) {
	var $el = $(el);

	if($el.length === 1) {
		if((/checkbox/i).test($el[0].type))
			return $el.is(':checked');

		var val = $el.val();

		if(val === 'on' || val === 'true') val = true;
		else if(val === 'undefined') val = undefined;

		return val;
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
	
value.events = [ 'blur', 'change', 'input' ];

function parts(el) {
	var _parts = $(el).find('[data-part]').toArray();
	// if the property is in "parts" we need to collect vales from all
	// the parts (elements). return if not all parts are set
	if(_.some(_parts, function(el) { 
		return !($(el).val() || $(el).html()); 
	}))
		return null;
	else
		return _parts.map(function(el) { return ($(el).val() || $(el).html()); }).join(' ').trim();
}

parts.events = [ 'input', 'change', 'blur' ];

module.exports = {
	html: html,

	value: value,

	parts: parts,

	src: function(el) {
		return $(el).attr('src');
	},

	selectMultiple: function(el) {
		return $(el).val();
	}
};
