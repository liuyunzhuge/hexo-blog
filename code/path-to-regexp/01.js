import { pathToRegexp } from './index.js'

const keys = [];
const regexp = pathToRegexp("/user/:id", keys);

console.log(regexp)
console.log(keys)