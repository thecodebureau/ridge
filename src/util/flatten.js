export default function dot(obj, result, path) {
  result = result || {};
  path = path || [];

  _.each(obj, (value, key) => {
    if (_.isObject(value)) return dot(value, result, path.concat(key));

    result[path.concat(key).join('.')] = value;
  });

  return result;
}
