// return an unflattened copy of attrs
// merging dot-delimited attributes with nested attributes in this.attributes
export default function unflatten(attrs, mergeAttrs) {
  const result = {};
  const attributes = mergeAttrs || {};

  // eslint-disable-next-line
  for (let attr in attrs) {
    const val = attrs[attr];
    const path = attr.split('.');

    if (path.length > 1) {
      attr = path.pop();

      const obj = _.reduce(path, makeNested, result);

      if (obj[attr] !== val) {
        obj[attr] = val;
      }
    } else {
      result[attr] = val;
    }
  }

  function makeNested(obj, key, level) {
    const attrs = (level || _.has(obj, key) ? obj : attributes)[key];

    obj = obj[key] = {};

    _.some(attrs, (val, key) => {
      // check that we are not iterating an array-like object
      if (typeof key === 'number') return true;

      obj[key] = val;
    });

    return obj;
  }

  return result;
}
