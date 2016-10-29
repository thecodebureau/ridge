export function email(value) {
  // From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
  // Retrieved 2014-01-14
  // If you have a problem with this implementation, report a bug against the above spec
  // Or use custom methods to implement your own email validation
  // return this.optional( element ) ||
  // /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}
  //    [a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ .test( value );

  return /^[\w.%!#$%&'*+\/=?^\-`{|}~]+@[\w.-]+\.[a-zA-Z]{2,4}$/.test(value);
}

email._name = 'email';

export function maxlength(number) {
  function fnc(string) {
    return string.length <= number;
  }

  // eslint-disable-next-line prefer-rest-params
  fnc._parameters = _.toArray(arguments);

  fnc._name = 'maxlength';

  return fnc;
}

export function minlength(number) {
  function fnc(string) {
    return string.length >= number;
  }

  // eslint-disable-next-line prefer-rest-params
  fnc._parameters = _.toArray(arguments);

  fnc._name = 'minlength';

  return fnc;
}

export function truthy(value) {
  return !!value;
}

truthy._name = 'truthy';

export function required(value) {
  if (/^</.test(value)) {
    /* if HTML string, test if tags contain any text */
    return value.split(/<.*?>/).join('').trim();
  }

  /* if not HTML string, test if truthy, is boolean or equals 0 */
  return !!value || _.isBoolean(value) || value === 0;
}

required._name = 'required';

export function equalTo(property) {
  function fnc(value) {
    return value === this.get(property);
  }

  // eslint-disable-next-line prefer-rest-params
  fnc._parameters = _.toArray(arguments);

  fnc._name = 'equalTo';

  return fnc;
}

export function date(value) {
  return _.isDate(value) && !!value.getTime();
}

date._name = 'date';

export function dateString(value) {
  return /^(19|20)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/.test(value);
}

dateString._name = 'dateString';

export function timeString(value) {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]/.test(value);
}

timeString._name = 'timeString';

export function number(value) {
  return /^\d+$/.test(value);
}
