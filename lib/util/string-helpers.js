var p = String.prototype;

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
	return this.toCamelCase(true);
};

// converts camelCase or PascalCase to spinal-case/
p.toSpinalCase = function() {
	return (this.charAt(0).toLowerCase() + this.slice(1)).replace(/([A-Z])/, '-$&').toLowerCase();
};

// converts camelCase or PascalCase to snake_case/
p.toSnakeCase = function() {
	return (this.charAt(0).toLowerCase() + this.slice(1)).replace(/([A-Z])/, '_$&').toLowerCase();
};
