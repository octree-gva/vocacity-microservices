/**
 * in an ideal world, we would use uuidv4 to define ids.
 * BUT jelastic infrastructure have a limitation in 23 chars
 * for ids, so we need to define a custom function that will:
 * - ensure first char is a letter
 * - ensure the slug will always be 22 chars
 *
 * @param str whatever text
 */
export const toSlug = (str: string | number) => {
  let temp = `${str}`.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  if (temp[0] < "a" || temp[0] > "z") {
    temp = `w${temp}`;
  }
  while (temp.length < 20) {
    temp += `${+new Date()}`;
  }
  return temp.substring(0, 22);
};
