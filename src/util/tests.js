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

function truthy(value) {
  return !!value;
}

truthy._name = 'truthy';

function required(value) {
  if(/^</.test(value))
    /* if HTML string, test if tags contain any text */
    return value.split(/<.*?>/).join('').trim();
  else 
    /* if not HTML string, test if truthy, is boolean or equals 0 */
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

function date(value) {
  return _.isDate(value) && !!value.getTime();
}

date._name = "date";

function dateString(value) {
  return /^(19|20)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/.test(value);
}

dateString._name = "dateString";

function timeString(value) {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]/.test(value);
}

timeString._name = "timeString";

function number(value) {
  return /^\d+$/.test(value);
}

number._name = 'number';

module.exports = {
  date: date,
  dateString: dateString,
  email: email,
  equalTo: equalTo,
  maxlength: maxlength,
  minlength: minlength,
  number: number,
  required: required,
  truthy: truthy,
  timeString: timeString
};
