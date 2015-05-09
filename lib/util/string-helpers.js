var p = String.prototype;

// normalize always returns the string in spinal-case
function normalize(str) {
	var arr = str.split(/[\s-_.]/);

	if(arr.length > 1)
		return arr.map(function(part) { return part.toLowerCase(); }).join('-');
	else
		return (str.charAt(0).toLowerCase() + str.slice(1)).replace(/([A-Z])/, '-$&').toLowerCase();
}

// Converts spinal-case, snake_case or space case to camelCase
p.toCamelCase = function(pascalCase) {
	var str = this.toLowerCase();

	var arr = str.split(/[\s-_]/);

	for(var i = pascalCase ? 0 : 1; i < arr.length; i++) {
		arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
	}

	return arr.join('');
};

// Converts spinal-case, snake_case or space case to PascalCase
p.toPascalCase = function() {
	return normalize(this).toCamelCase(true);
};

// converts camelCase or PascalCase to spinal-case/
p.toSpinalCase = function() {
	return normalize(this);
};

// converts camelCase or PascalCase to snake_case/
p.toSnakeCase = function() {
	return normalize(this).split('-').join('_');
};

p.toSpaceCase = function(capitals) {
	return normalize(this).split('-').map(function(part) {
		return capitals ? part.charAt(0).toUpperCase() + part.slice(1) : part;
	}).join(' ');
};
