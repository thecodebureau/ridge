
module.exports = {
	html: function() {
		return $(this).html();
	},

	value: function() {
		return $(this).val();
	},

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

	checkRadio: function(value) {
		var values = [];

		if(_.isArray(this))
			this.forEach(function(el) {
				if(el.checked)
					values.push(el.value);
			});
		else
			return this.value;

		return this[0].type === 'radio' ? values[0] : values;
	},

	src: function(value) {
		return $(this).attr('src');
	},

	select: function() {
		return $(this).val();
	},

	selectMultiple: function(value) {
		return $(this.val());
	}
};
