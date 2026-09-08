import test from 'node:test';
import assert from 'node:assert/strict';
import { createMachine } from '../lib/machine.ts';
import { playbackReducer } from '../lib/playback.ts';

test('rewind restores each complete state across writes, output, and halt', () => {
  let state = {current: createMachine(), past: []};
  const snapshots = [state.current];
  for (let i=0;i<30;i++) {
    state = playbackReducer(state, {type:'next'});
    snapshots.push(state.current);
  }
  assert.equal(state.current.output,14);
  assert.equal(state.current.halted,true);
  for(let i=29;i>=0;i--) {
    state = playbackReducer(state,{type:'previous'});
    assert.deepEqual(state.current,snapshots[i]);
  }
  assert.equal(playbackReducer(state,{type:'previous'}),state);
  state = playbackReducer(state,{type:'next',count:30});
  assert.deepEqual(state.current,snapshots[30]);
});

test('loading a different program discards prior playback history', () => {
  let state=playbackReducer({current:createMachine(),past:[]},{type:'next',count:12});
  const fresh=createMachine([7,2,3],'product');
  state=playbackReducer(state,{type:'load',machine:fresh});
  assert.equal(state.past.length,0);
  assert.equal(playbackReducer(state,{type:'previous'}).current,fresh);
});
