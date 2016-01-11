// return an unflattened copy of attrs
// merging dot-delimited attributes with nested attributes in this.attributes
module.exports = function(attrs, mergeAttrs) {
	var result = {},
		attributes = mergeAttrs || {};

	for (var attr in attrs) {
		var val = attrs[attr],
			path = attr.split('.');

		if (path.length > 1) {
			attr = path.pop();

			var obj = _.reduce(path, makeNested, result);

			if (obj[attr] !== val)
				obj[attr] = val;
		} else {
			result[attr] = val;
		}
	}

	function makeNested(obj, key, level) {
		var attrs = (level || _.has(obj, key) ? obj : attributes)[key];

		obj = obj[key] = {};

		_.some(attrs, function(val, key) {
			// check that we are not iterating an array-like object
			if (typeof key == 'number') return true;
			obj[key] = val;
		});

		return obj;
	}

	return result;
};
