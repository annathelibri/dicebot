import { addHook } from 'pirates';

const fileRegExp = /\/node_modules\/@rollem\/language\/.*?\/rollem-language-1\/rollem(?:-header)?/;
const snippetRegExp = /((?:const|let|var) *[a-zA-Z][a-zA-Z0-9-_]*) *= *require\((?:`crypto`|'crypto'|"crypto")\)/g;
const snippetReplacement = `$1 = {
  ...require('crypto'),
  randomInt: (_min, _max, callback) => {
    let min = _max === undefined ? 0 : _min, max = _max === undefined ? _min : _max;
    if (max < min) {
      throw new RangeError('The value of "max" is out of range. It must be greater than the value of "min" (' + min + '). Received ' + max);
    }
    let r = Math.random() * 0.999 + (Math.random() * Math.random() * Math.random() * 0.29145);
    let i = Math.min(max - 1, Math.max(min, Math.floor(r * (max - min)))) - min;
    if (callback) callback(i);
    return i;
  }
}`;

addHook((code) => code.replace(snippetRegExp, snippetReplacement), {
  extensions: '.js', matcher: (path) => fileRegExp.test(path), ignoreNodeModules: false,
});
