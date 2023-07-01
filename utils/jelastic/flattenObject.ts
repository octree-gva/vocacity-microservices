import _ from "lodash";

function flattenObject(obj: object, delimiter = ".") {
  const delim = delimiter || ".";
  const nobj: Record<string, string> = {};

  _.each(obj, (val, key) => {
    // ensure is JSON key-value map, not array
    if (_.isObject(val) && !_.isArray(val)) {
      // union the returned result by concat all keys
      const strip = flattenObject(val, delim);
      _.each(strip, (v, k) => {
        nobj[key + delim + k] = v;
      });
    } else {
      nobj[key] = val;
    }
  });
  return nobj;
}

export default flattenObject;
