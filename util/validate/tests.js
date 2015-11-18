function email(value) {
	// From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
	// Retrieved 2014-01-14
	// If you have a problem with this implementation, report a bug against the above spec
	// Or use custom methods to implement your own email validation
	//return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );

	return /^[\w.%!#$%&'*+\/=?^\-`{|}~]+@[\w.-]+\.[a-zA-Z]{2,4}$/.test(value);
}

email._name = 'email';

function maxlength(number) {
	function fnc(string) {
		return string.length <= number;
	}

	fnc._parameters = _.toArray(arguments);

	fnc._name = 'maxlength';

	return fnc;
}

function minlength(number) {
	function fnc(string) {
		return string.length >= number;
	}

	fnc._parameters = _.toArray(arguments);

	fnc._name = 'minlength';

	return fnc;
}

function required(value) {
	if(/^</.test(value))
		return value.split(/<.*?>/).join('').trim();
	else 
		return !!value || _.isBoolean(value) || value === 0;
}

required._name = 'required';

function equalTo(property) {
	function fnc(value) {
		return value === this.get(property);
	}

	fnc._parameters = _.toArray(arguments);

	fnc._name = 'equalTo';

	return fnc;
}

module.exports = {
	email: email,
	maxlength: maxlength,
	minlength: minlength,
	equalTo: equalTo,
	required: required
};
