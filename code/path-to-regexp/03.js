import { pathToRegexp } from './index.js'

const keys = [];
const regexp = pathToRegexp("/:foo/:bar", keys);

console.log(keys)
// [{name: "foo", prefix: "/", suffix: "", pattern: "[^\/#\?]+?", modifier: ""},
// {name: "bar", prefix: "/", suffix: "", pattern: "[^\/#\?]+?", modifier: ""}]
