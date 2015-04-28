require('./animate');

$.fn.JSONify = $.fn.JSONify || function(returnString) {
	var o = {};
	var
		rCRLF = /\r?\n/g,
		rcheckableType = /^(?:checkbox|radio)/i;

	var elements = this.find('[name], [data-name]').each(function() {
		var name = $(this).attr('name') || $(this).data('name');

		if(rcheckableType.test($(this).attr('type')) && !this.checked) return;

		if($(this).is('[type="file"]')) 
			value = this.files[0];
		else 
			value = this.value || this.innerHTML;

		if(!value) return;

		var path = name.split('.');
		var ref = o;

		for (var i = 0; i < path.length; i++) {
			var match = path[i].match(/\[(\d+)\]$/);

			if(match)
				path[i] = path[i].substring(0,match.index);

			if (!ref[path[i]]) {
				if(match) {
					ref[path[i]] = [];
					ref[path[i]][match[1]] = i === path.length - 1 ? value : {};
					ref = ref[path[i]][match[1]];
				} else {
					ref[path[i]] = i === path.length - 1 ? value : {};
					ref = ref[path[i]];
				}
			} else if (i === path.length - 1) {
				if (!ref[path[i]].push) {
					// if value already exists but is not an array, create array from current value
					ref[path[i]] = [ref[path[i]]];
				}
				ref[path[i]].push(value);
			} else {
				ref = ref[path[i]];
			}
		}
	});

	return returnString ? JSON.stringify(o) : o;
};

$.fn.ancestors = $.fn.ancestors || function(selector, stop) {
	var nodes = [];
	var $node = $(this).parent().closest(selector, stop);
	while($node.length > 0) {
		nodes.push($node[0]);
		$node = $node.parent().closest(selector, stop);
	}
	return $(nodes);
};
