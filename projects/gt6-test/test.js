const { add, multiply, greet } = require('./index');
let passed = 0, failed = 0;

function assert(name, actual, expected) {
  if (actual === expected) { passed++; console.log(`  PASS: ${name}`); }
  else { failed++; console.log(`  FAIL: ${name} — got ${actual}, expected ${expected}`); }
}

console.log('GT-6 Build Test Suite');
console.log('====================');
assert('add(2,3) = 5', add(2, 3), 5);
assert('add(-1,1) = 0', add(-1, 1), 0);
assert('multiply(4,5) = 20', multiply(4, 5), 20);
assert('multiply(0,99) = 0', multiply(0, 99), 0);
assert('greet returns string', typeof greet('X'), 'string');
assert('greet includes name', greet('AKIOR').includes('AKIOR'), true);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
