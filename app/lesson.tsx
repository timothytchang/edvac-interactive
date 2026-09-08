'use client';
import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ArrowDown,
  Check,
  BookOpen,
  StepForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  createMachine,
  stepMachine,
  textInstruction,
  stages,
  names,
  type Op,
} from '@/lib/machine';
const lessons = [
  'Meet the machine',
  'Follow an instruction',
  'Change the program',
  'Memory in motion',
];
const organs = [
  {
    code: 'I',
    name: 'Input',
    description:
      'Brings numbers and coded instructions from an outside medium into memory.',
  },
  {
    code: 'M',
    name: 'Memory',
    description:
      'Holds both instructions and numbers, including intermediate results. An address identifies a storage location. In this proposal, information travels between memory and a centralized arithmetic organ.',
  },
  {
    code: 'CC',
    name: 'Central control',
    description:
      'Reads an instruction and directs the other organs. It selects the operation, memory addresses, and next instruction.',
  },
  {
    code: 'CA',
    name: 'Central arithmetic',
    description:
      'Calculates with values in ICA and JCA. OCA holds the result until an instruction writes it back to memory.',
  },
  {
    code: 'O',
    name: 'Output',
    description:
      'Transfers a result from the machine to an outside medium so someone can use it.',
  },
];
export default function Home() {
  const [lesson, setLesson] = useState('0'),
    [organ, setOrgan] = useState(1),
    [m, setM] = useState(() => createMachine()),
    [running, setRunning] = useState(false),
    [selected, setSelected] = useState(0),
    [variant, setVariant] = useState('sum'),
    [values, setValues] = useState([3, 4, 2]),
    [loadedValues, setLoadedValues] = useState([3, 4, 2]),
    [guess, setGuess] = useState(''),
    [feedback, setFeedback] = useState(''),
    [position, setPosition] = useState(0),
    [target, setTarget] = useState(3),
    [pulseRunning, setPulseRunning] = useState(false);
  useEffect(() => {
    if (!running || m.halted) return;
    const t = setTimeout(() => setM((s) => stepMachine(s)), 1150);
    return () => clearTimeout(t);
  }, [running, m]);
  useEffect(() => {
    if (m.halted) setRunning(false);
  }, [m.halted]);
  useEffect(() => {
    if (!pulseRunning) return;
    const t = setInterval(() => setPosition((p) => (p + 1) % 8), 850);
    return () => clearInterval(t);
  }, [pulseRunning]);
  const reset = (v = variant) => {
    setRunning(false);
    setM(createMachine(values, v));
    setLoadedValues([...values]);
    setSelected(0);
    setFeedback('');
  };
  const changeLesson = (v: unknown) => {
    setLesson(String(v));
    setRunning(false);
    setPulseRunning(false);
  };
  const machineRef = useRef(m);
  machineRef.current = m;
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            t: Tool,
            o: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'edvac_read_machine',
      description: 'Read the visible teaching machine state.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({
        pc: machineRef.current.pc,
        instruction: machineRef.current.ir,
        ICA: machineRef.current.left,
        JCA: machineRef.current.right,
        OCA: machineRef.current.result,
        output: machineRef.current.output,
        halted: machineRef.current.halted,
      }),
    });
    register({
      name: 'edvac_step_machine',
      description:
        'Pause automatic play and advance the visible EDVAC teaching model by 1 to 30 fetch/decode/execute movements.',
      inputSchema: {
        type: 'object',
        properties: { count: { type: 'integer', minimum: 1, maximum: 30 } },
        required: ['count'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        const v = input as { count?: unknown };
        if (
          !v ||
          typeof v.count !== 'number' ||
          !Number.isInteger(v.count) ||
          v.count < 1 ||
          v.count > 30 ||
          Object.keys(v).some((k) => k !== 'count')
        )
          throw Error('count must be an integer from 1 through 30.');
        let next = machineRef.current;
        for (let i = 0; i < v.count; i++) next = stepMachine(next);
        flushSync(() => {
          setRunning(false);
          setLesson('1');
          setM(next);
        });
        return {
          pc: next.pc,
          output: next.output,
          halted: next.halted,
          message: next.message,
        };
      },
    });
    return () => lifecycle.abort();
  }, []);
  const cell = m.memory[selected],
    ir = m.ir,
    lastStage = m.ticks ? (m.halted ? 2 : (m.stage + 2) % 3) : -1;
  const first = m.memory[2],
    second = m.memory[6];
  const symbol = (op: Op) => (op === 'MUL' ? '×' : op === 'SUB' ? '−' : '+');
  const calculation =
    first.kind === 'instruction' && second.kind === 'instruction'
      ? first.value.op === 'JMP'
        ? `b ${symbol(second.value.op)} c · subtotal skipped`
        : `(a ${symbol(first.value.op)} b) ${symbol(second.value.op)} c`
      : 'the loaded program';
  const expected =
    variant === 'sum'
      ? (values[0] + values[1]) * values[2]
      : values[0] * values[1] + values[2];
  return (
    <main>
      <header className="masthead">
        <a className="brand" href="#main">
          <span className="brand-symbol">
            E<span>•</span>
          </span>
          <span>COMPUTING HISTORY</span>
        </a>
        <a className="source-link" href="#historical">
          <BookOpen size={16} />
          Historical notes
        </a>
      </header>
      <div className="page-heading" id="main">
        <div>
          <p className="eyebrow">1945 / THE STORED-PROGRAM IDEA</p>
          <h1>
            <em>EDVAC</em> architecture
          </h1>
          <p className="intro">
            Explore how the 1945 proposal organized memory, arithmetic, and
            control to execute a stored program.
          </p>
        </div>
      </div>
      <Tabs value={lesson} onValueChange={changeLesson} className="lessons">
        <TabsList className="lesson-nav">
          {lessons.map((l, i) => (
            <TabsTrigger value={String(i)} key={l} className="lesson-tab">
              <span className="lesson-index">0{i + 1}</span>
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="0">
          <section className="opening-grid">
            <div className="lesson-copy">
              <p className="eyebrow">01 / LOGICAL ORGANIZATION</p>
              <h2>The stored program</h2>
              <p>
                Programmers configured the original ENIAC through cable
                connections and switch settings. The setup determined which
                operations ran and how values moved between units. Changing the
                procedure could therefore require changing those connections.
              </p>
              <p>
                The EDVAC proposal placed coded instructions in the same memory
                used for numbers. Central control would read each instruction
                and direct a shared arithmetic unit. Loading a different
                instruction sequence changed the calculation without
                reconnecting those units.
              </p>
              <p className="subtle">
                Some relay calculators already read and executed instructions
                from tape one at a time. Loading instructions into addressable
                memory let control select a different part of the program
                without moving through the intervening tape.
              </p>
              <div className="callout">
                <span className="tiny-title">
                  Instructions, addresses, and values
                </span>
                An instruction specifies an operation. An address identifies a
                memory location. The value at that location can be an input to
                the calculation or a result stored for later use.
              </div>
              <Button className="primary" onClick={() => changeLesson('1')}>
                Follow a calculation <ArrowRight size={17} />
              </Button>
            </div>
            <div className="blueprint">
              <div className="panel-top">
                <span>FIVE LOGICAL ORGANS</span>
                <span className="status-dot">1945 proposal</span>
              </div>
              <div className="external-medium">
                <span>R · outside recording medium</span>
                <p>
                  Program and data enter through I; results leave through O.
                </p>
              </div>
              <div className="organ-map">
                <button
                  className={'organ input ' + (organ === 0 ? 'chosen' : '')}
                  onClick={() => setOrgan(0)}
                >
                  <span>I</span>Input
                </button>
                <div className="connection horizontal">→</div>
                <button
                  className={'organ memory ' + (organ === 1 ? 'chosen' : '')}
                  onClick={() => setOrgan(1)}
                >
                  <span>M</span>Memory<small>instructions + numbers</small>
                </button>
                <div className="connection horizontal">→</div>
                <button
                  className={'organ output ' + (organ === 4 ? 'chosen' : '')}
                  onClick={() => setOrgan(4)}
                >
                  <span>O</span>Output
                </button>
                <div className="lower-organs">
                  <button
                    className={'organ ' + (organ === 2 ? 'chosen' : '')}
                    onClick={() => setOrgan(2)}
                  >
                    <span>CC</span>Central control
                  </button>
                  <span className="connection">↔</span>
                  <button
                    className={'organ ' + (organ === 3 ? 'chosen' : '')}
                    onClick={() => setOrgan(3)}
                  >
                    <span>CA</span>Central arithmetic
                  </button>
                </div>
                <p className="map-caption">
                  Memory exchanges information with control and arithmetic.
                  <br />
                  Control directs the operations of the machine.
                </p>
              </div>
              <div className="organ-detail" aria-live="polite">
                <span className="detail-code">{organs[organ].code}</span>
                <div>
                  <h3>{organs[organ].name}</h3>
                  <p>{organs[organ].description}</p>
                </div>
              </div>
              <p className="panel-note">
                Select an organ to explore its role. This is a logical map, not
                a cabinet layout.
              </p>
            </div>
          </section>
          <section className="concept-strip">
            <div>
              <span>01</span>
              <h3>EDVAC hardware paradigm</h3>
              <p>
                The proposed hardware combined electronic computation with a
                large, fast memory holding binary information.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Von Neumann architecture paradigm</h3>
              <p>
                The logical design centralized arithmetic and control and
                connected them to a shared memory for instructions and data.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>Modern code paradigm</h3>
              <p>
                Instruction codes specified operations and their operands. The
                control organ read and executed these codes in sequence, with
                branches allowing the sequence to change.
              </p>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="1">
          <div className="workbench-heading">
            <div>
              <p className="eyebrow">02 / INSTRUCTION EXECUTION</p>
              <h2>Fetch, decode, and execute</h2>
              <p>
                Calculate <strong>{calculation}</strong> with a ={' '}
                {loadedValues[0]}, b = {loadedValues[1]}, c = {loadedValues[2]}.
                Use <strong>Step</strong> to make one movement at a time.
              </p>
              <p className="register-intro">
                ICA, JCA, and OCA are registers: small storage circuits inside
                the arithmetic organ. READ places a value in ICA and shifts its
                previous value into JCA. Arithmetic writes its result to OCA; a
                separate WRITE instruction copies that result into memory.
              </p>
            </div>
            <span className="model-label">FIRST DRAFT · TEACHING MODEL</span>
          </div>
          <div className="controls">
            <Button
              className="primary"
              disabled={m.halted}
              onClick={() => {
                setRunning(false);
                setM((s) => stepMachine(s));
              }}
            >
              <StepForward size={17} />
              Step
            </Button>
            <Button
              variant="outline"
              onClick={() => setRunning(!running)}
              disabled={m.halted}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}{' '}
              {running ? 'Pause' : 'Auto play'}
            </Button>
            <Button variant="ghost" onClick={() => reset()}>
              <RotateCcw size={16} />
              Reset
            </Button>
            <span className="run-status">
              {m.error
                ? 'Stopped · check program'
                : m.halted
                  ? 'Finished'
                  : running
                    ? 'Running'
                    : 'Paused'}
              <span> / {m.ticks} movements</span>
            </span>
          </div>
          <div className="machine-grid">
            <section className="memory-panel">
              <div className="panel-top">
                <h3>
                  <span className="organ-letter">M</span>Shared memory
                </h3>
                <span>24 teaching words</span>
              </div>
              <div className="memory-legend">
                <span>
                  <i className="instruction-key" />
                  Instruction
                </span>
                <span>
                  <i className="number-key" />
                  Number
                </span>
              </div>
              <div className="memory-list">
                {m.memory.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={
                      'memory-row ' +
                      (c.kind === 'instruction' ? 'is-instruction ' : '') +
                      (m.active.includes(i) ? 'lit ' : '') +
                      (selected === i ? 'selected' : '')
                    }
                    aria-label={`Address ${i}: ${c.kind === 'number' ? c.value : textInstruction(c.value)}`}
                  >
                    <span className="address">
                      {String(i).padStart(2, '0')}
                    </span>
                    <span className="cell-value">
                      {c.kind === 'instruction'
                        ? textInstruction(c.value)
                        : c.value}
                    </span>
                    <span className="cell-role">
                      {i === m.pc
                        ? '← next'
                        : names[i]
                          ? names[i]
                          : c.kind === 'instruction'
                            ? 'order'
                            : '—'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section className="processor-panel">
              <div className="control-card">
                <div className="panel-top">
                  <h3>
                    <span className="organ-letter">CC</span>Central control
                  </h3>
                  <span>directs</span>
                </div>
                <div className="address-display">
                  <span>PROGRAM COUNTER · NEXT ADDRESS</span>
                  <strong>{String(m.pc).padStart(2, '0')}</strong>
                </div>
                <div className="instruction-display">
                  <span className="tiny-title">CURRENT INSTRUCTION</span>
                  <strong>
                    {ir ? textInstruction(ir) : 'Waiting for fetch'}
                  </strong>
                </div>
                <div className="stage-track">
                  {stages.map((s, i) => (
                    <span className={lastStage === i ? 'current' : ''} key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flow-link">
                <ArrowDown size={21} />
                <span>
                  {lastStage === 2
                    ? 'execute the decoded instruction'
                    : 'control directs the operation'}
                </span>
              </div>
              <div
                className={
                  'arithmetic-card ' + (lastStage === 2 ? 'illuminated' : '')
                }
              >
                <div className="panel-top">
                  <h3>
                    <span className="organ-letter">CA</span>Central arithmetic
                  </h3>
                  <span>registers hold values</span>
                </div>
                <div className="arithmetic-values">
                  <div>
                    <span>JCA · earlier input</span>
                    <strong>{m.right ?? '—'}</strong>
                  </div>
                  <div>
                    <span>ICA · latest input</span>
                    <strong>{m.left ?? '—'}</strong>
                  </div>
                  <div>
                    <span>OCA · result</span>
                    <strong className="result">{m.result ?? '—'}</strong>
                  </div>
                </div>
              </div>
              <div className="output-card">
                <span>
                  <span className="organ-letter">O</span>Output
                </span>
                <strong>{m.output ?? '—'}</strong>
                <small>
                  {m.output === null
                    ? 'Nothing sent yet'
                    : 'Delivered outside the machine'}
                </small>
              </div>
            </section>
            <aside className="explanation-panel">
              <span className="eyebrow">Current operation</span>
              <div className="step-number">
                {m.halted
                  ? '■'
                  : String(Math.max(0, lastStage) + 1).padStart(2, '0')}
              </div>
              <h3>
                {m.error
                  ? 'An invalid operation'
                  : m.halted
                    ? 'The machine has stopped'
                    : m.ticks
                      ? stages[lastStage]
                      : 'Ready to fetch'}
              </h3>
              <p className="live-explanation" aria-live="polite">
                {m.message}
              </p>
              <hr />
              <span className="tiny-title">
                SELECTED ADDRESS · {String(selected).padStart(2, '0')}
              </span>
              <h4>
                {cell.kind === 'instruction'
                  ? 'A coded instruction'
                  : 'A stored number'}
              </h4>
              <p>
                {cell.kind === 'instruction'
                  ? cell.value.op === 'HALT'
                    ? 'HALT is our teaching command for stopping.'
                    : cell.value.op === 'OUT'
                      ? 'OUT is our teaching command for sending a stored value to output.'
                      : 'The operation code tells control what to do. READ and WRITE also carry an address telling it where to access memory.'
                  : 'This is a value used or produced by the calculation. An address tells the machine where to find it.'}
              </p>
              <p className="subtle">
                Colors are teaching annotations. Real memory stores bit
                patterns, not these labels.
              </p>
              {m.halted && !m.error && (
                <Button className="primary" onClick={() => changeLesson('2')}>
                  Change the program <ArrowRight size={16} />
                </Button>
              )}
            </aside>
          </div>
          <div className="instruction-key-panel">
            <p>
              <strong>Four instructions to add and save:</strong>{' '}
              <code>READ 16 → READ 17 → ADD → WRITE 17</code>
            </p>
            <p>
              The reads place a and b in JCA and ICA. ADD leaves the sum in OCA.
              Only WRITE changes memory. Address 17 is a location; its contents
              begin as b and become the subtotal.
            </p>
            <p>
              <strong>Fetch advances the counter.</strong> The instruction
              already copied into control still executes. The counter identifies
              where the <em>following</em> fetch will look.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="2">
          <section className="experiment-grid">
            <div className="lesson-copy">
              <p className="eyebrow">03 / PROGRAM MODIFICATION</p>
              <h2>Program and input changes</h2>
              <p>
                Changing the input numbers preserves the sequence of operations.
                Switching programs changes that sequence while reusing the same
                memory, control, and arithmetic units. Load either example below
                to observe the difference.
              </p>
              <div className="input-values">
                {values.map((v, i) => (
                  <label key={i}>
                    {['a', 'b', 'c'][i]}
                    <input
                      type="number"
                      min="-99"
                      max="99"
                      value={v}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && Math.abs(n) <= 99) {
                          setValues(values.map((x, j) => (i === j ? n : x)));
                          setFeedback('');
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
              <p className="subtle">
                Small whole numbers, from −99 to 99, keep the arithmetic
                visible.
              </p>
              <div className="program-choices">
                {['sum', 'product'].map((v) => (
                  <Button
                    key={v}
                    variant="outline"
                    className={variant === v ? 'picked' : ''}
                    aria-pressed={variant === v}
                    onClick={() => {
                      setVariant(v);
                      setFeedback('');
                    }}
                  >
                    {v === 'sum' ? '(a + b) × c' : 'a × b + c'}
                  </Button>
                ))}
              </div>
              <Button
                className="primary"
                onClick={() => {
                  reset(variant);
                  changeLesson('1');
                }}
              >
                Load into memory <ArrowRight size={17} />
              </Button>
            </div>
            <div className="experiment-card">
              <span className="eyebrow">OUTPUT PREDICTION</span>
              <h3>Expected result</h3>
              <p>
                What should the machine produce for{' '}
                <strong>
                  {variant === 'sum'
                    ? `(${values[0]} + ${values[1]}) × ${values[2]}`
                    : `${values[0]} × ${values[1]} + ${values[2]}`}
                </strong>
                ?
              </p>
              <label className="prediction-label" htmlFor="prediction">
                Your prediction
              </label>
              <div className="prediction">
                <input
                  id="prediction"
                  type="number"
                  value={guess}
                  onChange={(e) => {
                    setGuess(e.target.value);
                    setFeedback('');
                  }}
                  placeholder="Enter a number"
                />
                <Button
                  className="primary"
                  onClick={() =>
                    setFeedback(
                      guess.trim() === ''
                        ? 'Enter a prediction first.'
                        : Number(guess) === expected
                          ? 'Correct. Now watch how the machine gets there.'
                          : 'Try the operation inside the parentheses first. For a × b + c, multiply before adding.',
                    )
                  }
                >
                  Check <Check size={16} />
                </Button>
              </div>
              <p className="feedback" aria-live="polite">
                {feedback}
              </p>
              <hr />
              <h3>Arithmetic instruction</h3>
              <p>
                Replace ADD or MUL at address 02. This loads a fresh program
                with your selected inputs.
              </p>
              <div className="program-choices">
                {(['ADD', 'SUB', 'MUL'] as Op[]).map((op) => (
                  <Button
                    key={op}
                    variant="outline"
                    onClick={() => {
                      const n = createMachine(values, variant);
                      if (n.memory[2].kind === 'instruction')
                        n.memory[2].value.op = op;
                      setM(n);
                      setLoadedValues([...values]);
                      setRunning(false);
                      setSelected(2);
                      changeLesson('1');
                    }}
                  >
                    {op}
                  </Button>
                ))}
              </div>
              <p className="subtle">
                These readable commands are teaching conventions, not the
                historical binary instruction codes.
              </p>
              <hr />
              <h3>Branch instruction</h3>
              <p>
                Replace address 02 with JMP 04. It skips the arithmetic at 02
                and the write at 03. Predict the result before running.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const n = createMachine(values, variant);
                  n.memory[2] = {
                    kind: 'instruction',
                    value: { op: 'JMP', address: 4 },
                  };
                  setM(n);
                  setLoadedValues([...values]);
                  setRunning(false);
                  setSelected(2);
                  changeLesson('1');
                }}
              >
                Load branch experiment <ArrowRight size={16} />
              </Button>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="3">
          <section className="delay-section">
            <div className="lesson-copy">
              <p className="eyebrow">04 / PHYSICAL STORAGE</p>
              <h2>Delay-line memory</h2>
              <p>
                The later built EDVAC used mercury acoustic delay lines.
                Electrical signals became sound pulses, traveled through
                mercury, and were converted back into electrical signals. The
                pulses were regenerated and sent through again.
              </p>
              <p>
                A word is a fixed-size group of bits stored and accessed
                together. In a delay line, a word becomes available when its
                pulses reach the receiving end. Select a word below, then
                advance circulation to observe the wait. Each step represents
                one word time: the interval needed for one complete word to pass
                the readout.
              </p>
            </div>
            <div className="delay-card">
              <div className="panel-top">
                <h3>Built EDVAC · eight-word delay line</h3>
                <span>Conceptual timing</span>
              </div>
              <div className="delay-words">
                {Array.from({ length: 8 }, (_, i) => {
                  const word = (position + i) % 8;
                  return (
                    <button
                      key={i}
                      className={
                        (word === target ? 'target-word ' : '') +
                        (i === 0 ? 'at-reader' : '')
                      }
                      aria-label={`Select word ${word}`}
                      aria-pressed={word === target}
                      onClick={() => setTarget(word)}
                    >
                      <small>WORD</small>
                      <strong>{word}</strong>
                    </button>
                  );
                })}
              </div>
              <div className="reader-marker">
                ↑ readout here<span>Words circulate past this point</span>
              </div>
              <div className="circulation-line">
                receive → regenerate → send back through the line ↺
              </div>
              <div className="delay-result" aria-live="polite">
                <strong>
                  {(target - position + 8) % 8 === 0
                    ? 'Available now'
                    : `${(target - position + 8) % 8} word times to wait`}
                </strong>
                <p>
                  Selected: word {target}. At the readout: word {position}.
                </p>
              </div>
              <div className="controls">
                <Button
                  className="primary"
                  onClick={() => setPosition((p) => (p + 1) % 8)}
                >
                  Advance one word <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPulseRunning(!pulseRunning)}
                >
                  {pulseRunning ? 'Pause' : 'Circulate'}
                </Button>
              </div>
              <p className="subtle">
                The boxes stand for whole words, not individual pulses. This
                model omits bit timing, switching overhead, and synchronization.
                The feedback path is functional; a mercury tube was not a ring.
              </p>
            </div>
          </section>
          <div className="takeaway">
            <span className="eyebrow">MEMORY ACCESS</span>
            <h3>Address placement and access time</h3>
            <p>
              The First Draft’s logical view abstracts away some physical
              details. Delay-line storage makes the cost of reading an address
              visible: control may have to wait. The later built EDVAC used an
              explicit next-address field, but that is a different design from
              the sequential instruction stream explored here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      <footer id="historical">
        <div>
          <p className="eyebrow">HISTORICAL NOTES / MODEL BOUNDARIES</p>
          <h3>Historical design and teaching model</h3>
          <p>
            This lesson follows the 1945 <em>First Draft</em> as explained by
            Haigh and Ceruzzi (pp. 15–17): five logical organs, 32-bit words,
            ICA/JCA/OCA working storage, and an incrementing program counter.
            The later built EDVAC used 44-bit words and four-address
            instructions. The main simulator follows the earlier proposal; the
            delay-line activity illustrates storage associated with the built
            machine.
          </p>
          <p>
            This lab uses 24 labeled cells, small signed integers, readable
            commands, and a fetch–decode–execute animation. READ models the
            ICA-to-JCA shift; WRITE copies OCA to a chosen address. MUL, SUB,
            JMP, OUT, and HALT use simplified teaching semantics. This is not a
            bit-exact emulator: we omit actual instruction encodings,
            fixed-point arithmetic, overflow rules, and circuit timing. Labels
            distinguish instructions and data for teaching; real memory holds
            bit patterns. The delay-line panel illustrates an eight-word line
            associated with built EDVAC.
          </p>
        </div>
        <div className="references">
          <a
            href="https://fab.cba.mit.edu/classes/862.16/notes/computation/vonNeumann-1945.pdf"
            target="_blank"
            rel="noreferrer"
          >
            First Draft · 1945, §§2.2–2.8 <ArrowRight size={15} />
          </a>
          <a
            href="https://ed-thelen.org/comp-hist/BRL61-e.html"
            target="_blank"
            rel="noreferrer"
          >
            Army survey · EDVAC, 1961 <ArrowRight size={15} />
          </a>
          <a
            href="https://www.computerhistory.org/revolution/birth-of-the-computer/4/87"
            target="_blank"
            rel="noreferrer"
          >
            Computer History Museum · Stored programs <ArrowRight size={15} />
          </a>
          <p>
            Read alongside Haigh & Ceruzzi,
            <br />
            <em>A New History of Modern Computing</em>, p. 15.
          </p>
        </div>
      </footer>
    </main>
  );
}
