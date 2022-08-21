import { addHook } from 'pirates';

const fileRegExp = /\/node_modules\/@rollem\/language\/.*?\/rollem-language-1\/rollem(?:-header)?/;
const snippetRegExp = /((?:const|let|var) *[a-zA-Z][a-zA-Z0-9-_]*) *= *require\((?:`crypto`|'crypto'|"crypto")\)/g;
const snippetReplacement = `$1 = {
  ...require('crypto'),
  randomInt: (_min, _max, callback) => {
    let min = _max === undefined ? 0 : _min, max = _max === undefined ? _min : _max;
    let i =  Math.floor(Math.min(1, Math.max(0, (Math.random() * 0.999 + (Math.random() * Math.random() * Math.random() * 0.29145)))) * (max - min + 1)) + min;
    if (callback) callback(i);
    return i;
  }
}`;

addHook((code) => code.replace(snippetRegExp, snippetReplacement), {
  extensions: '.js', matcher: (path) => fileRegExp.test(path), ignoreNodeModules: false,
});
