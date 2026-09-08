import { stepMachine, type Machine } from './machine.ts';

export type Playback = { current: Machine; past: Machine[] };
type Action =
  | { type: 'next'; count?: number }
  | { type: 'previous' }
  | { type: 'load'; machine: Machine };

export function playbackReducer(state: Playback, action: Action): Playback {
  if (action.type === 'load') return { current: action.machine, past: [] };
  if (action.type === 'previous') {
    if (!state.past.length) return state;
    return {
      current: state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
    };
  }
  let current = state.current;
  const past = [...state.past];
  for (let i = 0; i < (action.count ?? 1) && !current.halted; i++) {
    past.push(current);
    current = stepMachine(current);
  }
  return { current, past };
}
