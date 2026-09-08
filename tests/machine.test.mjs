import test from 'node:test';
import assert from 'node:assert/strict';
import { createMachine, stepMachine } from '../lib/machine.ts';
function steps(s, n) {
  for (let i = 0; i < n; i++) s = stepMachine(s);
  return s;
}
function finish(s) {
  for (let i = 0; i < 100 && !s.halted; i++) s = stepMachine(s);
  assert.equal(s.halted, true);
  return s;
}
test('fetch increments PC before executing, without altering registers', () => {
  const s = stepMachine(createMachine());
  assert.equal(s.pc, 1);
  assert.equal(s.irAddress, 0);
  assert.equal(s.ir.op, 'READ');
  assert.equal(s.left, null);
});
test('two reads put earlier input in JCA and latest in ICA', () => {
  const s = steps(createMachine(), 6);
  assert.equal(s.right, 3);
  assert.equal(s.left, 4);
  assert.equal(s.result, null);
});
test('addition changes OCA; only WRITE changes memory', () => {
  let s = steps(createMachine(), 9);
  assert.equal(s.result, 7);
  assert.equal(s.memory[17].value, 4);
  s = steps(s, 3);
  assert.equal(s.memory[17].value, 7);
});
test('sum program produces correct output and retains the final memory value', () => {
  const s = finish(createMachine());
  assert.equal(s.error, null);
  assert.equal(s.output, 14);
  assert.equal(s.memory[20].value, 14);
  assert.equal(s.ticks, 30);
  assert.equal(s.pc, 10);
});
test('input extremes, zero, and negatives agree with independent arithmetic', () => {
  for (const a of [-99, -1, 0, 3, 99])
    for (const b of [-99, 0, 4, 99])
      for (const c of [-99, 0, 2, 99]) {
        assert.equal(finish(createMachine([a, b, c])).output, (a + b) * c);
        assert.equal(
          finish(createMachine([a, b, c], 'product')).output,
          a * b + c,
        );
      }
});
test('editing arithmetic preserves operand order for subtraction', () => {
  const s = createMachine();
  s.memory[2].value.op = 'SUB';
  assert.equal(finish(s).output, -2);
});
test('branch replaces the incremented PC and skips the subtotal write', () => {
  let s = createMachine();
  s.memory[2] = { kind: 'instruction', value: { op: 'JMP', address: 4 } };
  s = steps(s, 9);
  assert.equal(s.pc, 4);
  assert.equal(s.memory[17].value, 4);
  assert.equal(finish(s).output, 8);
});
test('halt freezes the entire machine', () => {
  const s = finish(createMachine());
  assert.equal(stepMachine(s), s);
});
test('invalid next fetch stops with an explanatory error', () => {
  const s = createMachine();
  s.pc = 18;
  assert.match(stepMachine(s).error, /contains a number/);
});
test('out of range addresses and arithmetic on instructions stop safely', () => {
  for (const address of [99, -1, 1.2, 0]) {
    const s = createMachine();
    s.memory[0].value.address = address;
    assert.ok(steps(s, 3).error);
  }
});
test('stepping never mutates the previous state', () => {
  const s = createMachine(),
    before = JSON.stringify(s);
  finish(s);
  assert.equal(JSON.stringify(s), before);
});
test('reject invalid initial inputs', () => {
  for (const values of [[100, 0, 0], [NaN, 0, 0], [1.5, 0, 0], []])
    assert.throws(() => createMachine(values));
});
