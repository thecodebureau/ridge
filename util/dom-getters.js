
function html(el) {
	return $(el).html();
}

html.events = [ 'blur', 'input', 'change' ];

// NOTE important to pass jQuery object here, since it can radio or checkbox
// list
function value(el) {
	if((/radio|checkbox/i).test(el.type)) {
		// if the radio/checkbox has a form and a name, try get all others
		// with the same name. TODO impl
		if(el.name && el.form)
			el = el.form[el.name];

		// 'length' property exists only if el is a NodeList, ie there are
		// multiple checkboxes/radios
		if('length' in el) {
			if((/radio/i).test(el[0].type))
				return _.result(_.findWhere(el, { checked: true }), 'value');

			var arr = _.filter(el, 'checked').map(function(element) {
				return element.value;
			});

			return arr.length > 0 ? arr : null;
		}

		return el.checked;
	}

	return el.value;
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
