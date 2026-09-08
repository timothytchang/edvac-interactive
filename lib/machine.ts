export type Op =
  | 'READ'
  | 'WRITE'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'OUT'
  | 'JMP'
  | 'HALT';
export type Instruction = { op: Op; address?: number };
export type Cell =
  | { kind: 'instruction'; value: Instruction }
  | { kind: 'number'; value: number };
export type Machine = {
  memory: Cell[];
  pc: number;
  irAddress: number | null;
  stage: number;
  ir: Instruction | null;
  left: number | null;
  right: number | null;
  result: number | null;
  output: number | null;
  halted: boolean;
  error: string | null;
  ticks: number;
  message: string;
  active: number[];
};
export const stages = ['Fetch', 'Decode', 'Execute'];
export const names: Record<number, string> = {
  16: 'a',
  17: 'b / subtotal',
  18: 'c',
  20: 'answer',
};
const order = (op: Op, address?: number): Cell => ({
  kind: 'instruction',
  value: { op, address },
});
export function createMachine(values = [3, 4, 2], variant = 'sum'): Machine {
  if (
    values.length !== 3 ||
    values.some((v) => !Number.isInteger(v) || Math.abs(v) > 99)
  )
    throw Error('Use three whole-number inputs between −99 and 99.');
  const memory: Cell[] = Array.from({ length: 24 }, () => ({
    kind: 'number',
    value: 0,
  }));
  const program = [
    order('READ', 16),
    order('READ', 17),
    order(variant === 'sum' ? 'ADD' : 'MUL'),
    order('WRITE', 17),
    order('READ', 17),
    order('READ', 18),
    order(variant === 'sum' ? 'MUL' : 'ADD'),
    order('WRITE', 20),
    order('OUT', 20),
    order('HALT'),
  ];
  program.forEach((c, i) => (memory[i] = c));
  values.forEach((v, i) => {
    memory[16 + i] = { kind: 'number', value: v };
  });
  return {
    memory,
    pc: 0,
    irAddress: null,
    stage: 0,
    ir: null,
    left: null,
    right: null,
    result: null,
    output: null,
    halted: false,
    error: null,
    ticks: 0,
    message: 'Ready. Fetch the instruction at address 00 to begin.',
    active: [],
  };
}
export function stepMachine(prev: Machine): Machine {
  if (prev.halted) return prev;
  const s: Machine = {
    ...prev,
    memory: prev.memory.map((c) =>
      c.kind === 'number'
        ? { ...c }
        : { kind: 'instruction', value: { ...c.value } },
    ),
    ticks: prev.ticks + 1,
    active: [],
  };
  const addr = (a: unknown): number => {
    if (
      typeof a !== 'number' ||
      !Number.isInteger(a) ||
      a < 0 ||
      a >= s.memory.length
    )
      throw Error(`Address ${a} is outside this model’s 24-word memory.`);
    return a;
  };
  const read = (a: unknown) => {
    const at = addr(a),
      c = s.memory[at];
    if (c.kind !== 'number')
      throw Error(
        `Address ${at} holds an instruction. Choose a number cell for this arithmetic example.`,
      );
    return c.value;
  };
  try {
    if (s.stage === 0) {
      const c = s.memory[addr(s.pc)];
      if (c.kind !== 'instruction')
        throw Error(
          `Address ${s.pc} contains a number, not a supported instruction. Reset or load a valid program.`,
        );
      s.ir = { ...c.value };
      s.irAddress = s.pc;
      s.active = [s.pc];
      s.pc += 1;
      s.message = `Copy the instruction at ${String(s.irAddress).padStart(2, '0')} into control. Advance the program counter to ${String(s.pc).padStart(2, '0')}. The instruction has not executed yet.`;
    } else {
      const i = s.ir!;
      if (s.stage === 1) {
        const explanations: Record<Op, string> = {
          READ: `Read the number at address ${i.address} into ICA, shifting the previous ICA value into JCA.`,
          WRITE: `Copy OCA into memory address ${i.address}, replacing its old contents.`,
          ADD: 'Add JCA and ICA; put the result in OCA.',
          SUB: 'Subtract ICA from JCA; put the result in OCA.',
          MUL: 'Multiply JCA and ICA; put the result in OCA.',
          OUT: `Copy the number at address ${i.address} to the output.`,
          JMP: `Replace the program counter with ${i.address}; the next fetch will go there.`,
          HALT: 'Stop fetching instructions.',
        };
        s.message = `Decode ${i.op}: ${explanations[i.op]}`;
      }
      if (s.stage === 2) {
        if (i.op === 'READ') {
          const v = read(i.address);
          s.right = s.left;
          s.left = v;
          s.active = [i.address!];
          s.message = `Read ${v} from address ${i.address} into ICA. ${s.right === null ? 'JCA has no previous operand yet.' : `The previous ICA value, ${s.right}, shifts into JCA.`}`;
        } else if (i.op === 'WRITE') {
          if (s.result === null)
            throw Error('OCA has no calculated result to write.');
          const a = addr(i.address);
          s.memory[a] = { kind: 'number', value: s.result };
          s.active = [a];
          s.message = `Write OCA’s value ${s.result} into address ${a}. ${a === 17 ? 'The original b is replaced by the subtotal.' : 'The value in memory is now available to later instructions.'}`;
        } else if (i.op === 'OUT') {
          s.output = read(i.address);
          s.active = [i.address!];
          s.message = `Output copies ${s.output} from address ${i.address}. This teaching command makes the answer visible outside the machine.`;
        } else if (i.op === 'JMP') {
          s.pc = addr(i.address);
          s.active = [s.pc];
          s.message = `The branch replaces the program counter with ${s.pc}. The next fetch skips to that address instead of continuing in order.`;
        } else if (i.op === 'HALT') {
          s.halted = true;
          s.message =
            'HALT stops the machine. The program and its results remain in memory.';
        } else {
          if (s.left === null || s.right === null)
            throw Error('Read two operands before doing arithmetic.');
          s.result =
            i.op === 'ADD'
              ? s.right + s.left
              : i.op === 'SUB'
                ? s.right - s.left
                : s.right * s.left;
          if (!Number.isSafeInteger(s.result))
            throw Error('The result exceeds this model’s exact integer range.');
          s.message = `${s.right} ${i.op === 'ADD' ? '+' : i.op === 'SUB' ? '−' : '×'} ${s.left} = ${s.result}. OCA holds the result; memory is unchanged until a WRITE.`;
        }
      }
    }
    if (!s.halted) s.stage = (s.stage + 1) % 3;
  } catch (e) {
    s.error = (e as Error).message;
    s.message = s.error;
    s.halted = true;
  }
  return s;
}
export function textInstruction(i: Instruction) {
  return i.address === undefined
    ? i.op
    : `${i.op} ${String(i.address).padStart(2, '0')}`;
}
