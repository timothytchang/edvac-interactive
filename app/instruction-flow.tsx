import { textInstruction, type Machine } from '@/lib/machine';

export function InstructionFlow({
  machine: m,
  lastStage,
}: {
  machine: Machine;
  lastStage: number;
}) {
  const executing = lastStage === 2 && !m.error;
  const op = m.ir?.op;
  const route = m.error
    ? 'Execution stopped at an invalid operation.'
    : lastStage < 0
      ? 'Next: memory sends the instruction at address 00 to control.'
      : lastStage === 0
        ? `M → CC: fetch ${textInstruction(m.ir!)} from address ${m.irAddress}. The counter now points to ${m.pc}; the fetched instruction still has to execute.`
        : lastStage === 1
          ? `CC decodes ${textInstruction(m.ir!)} and determines the operation and any address it needs. No operand or result moves during this teaching step.`
          : op === 'READ'
            ? `M[${m.ir!.address}] → ICA; previous ICA → JCA. The addressed number moves into arithmetic; memory keeps its value.`
            : op === 'WRITE'
              ? `OCA → M[${m.ir!.address}]. The calculated result replaces the number at this memory address.`
              : op === 'OUT'
                ? `M[${m.ir!.address}] → O. The stored number is sent outside the machine; OCA is a different storage location.`
                : op === 'JMP'
                  ? `CC changes the program counter to ${m.pc}. The next fetch will use this address; no arithmetic value moves.`
                  : op === 'HALT'
                    ? 'CC stops execution. Memory and registers retain their values.'
                    : `JCA and ICA → OCA. ${op} produces a result inside arithmetic. Memory has not been updated.`;
  const active = (part: string) => {
    if (m.error || lastStage < 0) return false;
    if (lastStage === 0) return part === 'memory' || part === 'control';
    if (lastStage === 1 || op === 'JMP' || op === 'HALT')
      return part === 'control';
    if (op === 'OUT') return part === 'memory' || part === 'output';
    return (
      part === 'arithmetic' ||
      ((op === 'READ' || op === 'WRITE') && part === 'memory')
    );
  };
  const addr = m.irAddress ?? 0;
  const purpose =
    addr <= 3
      ? 'Combine a and b, then save the intermediate result at address 17.'
      : addr <= 7
        ? 'Read the intermediate result and c, calculate the final result, and save it at address 20.'
        : addr === 8
          ? 'Send the saved answer to the output organ.'
          : 'Stop after the answer has been sent.';
  return (
    <section className="flow-context" aria-label="Live instruction flow">
      <div className="flow-heading">
        <div>
          <h3>Instruction flow</h3>
          <p>
            <strong>Program context:</strong> {purpose} The highlighted path
            shows what the current instruction actually does, including any
            edits.
          </p>
        </div>
        <span className="flow-current">
          {m.ir
            ? `Address ${String(addr).padStart(2, '0')} · ${textInstruction(m.ir)}`
            : 'Program loaded · ready to fetch'}
        </span>
      </div>
      <div
        className="flow-scroll"
        tabIndex={0}
        role="region"
        aria-label="Flow diagram; scroll horizontally on narrow screens"
      >
        <svg
          className="flow-map"
          viewBox="0 0 820 250"
          role="img"
          aria-label={route}
        >
          <defs>
            <marker
              id="flow-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
          <path
            className={`flow-edge ${lastStage === 0 ? 'active' : ''}`}
            d="M 225 93 H 300"
            markerEnd="url(#flow-arrow)"
          />
          <text x="260" y="77" textAnchor="middle">
            fetch
          </text>
          <path
            className={`flow-edge control ${lastStage === 1 ? 'active' : ''}`}
            d="M 510 93 H 585"
            markerEnd="url(#flow-arrow)"
          />
          <text x="548" y="77" textAnchor="middle">
            direct
          </text>
          <path
            className={`flow-edge ${executing && op === 'READ' ? 'active' : ''}`}
            d="M 120 45 V 24 H 695 V 45"
            markerEnd="url(#flow-arrow)"
          />
          <text x="405" y="16" textAnchor="middle">
            READ: memory → ICA (previous ICA → JCA)
          </text>
          <path
            className={`flow-edge ${executing && op === 'WRITE' ? 'active' : ''}`}
            d="M 695 140 V 165 H 120 V 140"
            markerEnd="url(#flow-arrow)"
          />
          <text x="405" y="185" textAnchor="middle">
            WRITE: OCA → memory
          </text>
          <path
            className={`flow-edge ${executing && op === 'OUT' ? 'active' : ''}`}
            d="M 70 140 V 222 H 300"
            markerEnd="url(#flow-arrow)"
          />
          <text x="170" y="213" textAnchor="middle">
            OUT: memory → output
          </text>
          {[
            [
              'memory',
              15,
              'M · Memory',
              `Operand address: ${m.ir?.address ?? '—'}`,
            ],
            ['control', 300, 'CC · Control', `Next fetch address: ${m.pc}`],
            [
              'arithmetic',
              585,
              'CA · Arithmetic',
              `JCA ${m.right ?? '—'}   ICA ${m.left ?? '—'}   OCA ${m.result ?? '—'}`,
            ],
          ].map(([key, x, label, detail]) => (
            <g
              key={key}
              className={`flow-node ${active(String(key)) ? 'active' : ''}`}
            >
              <rect x={Number(x)} y="45" width="210" height="95" rx="8" />
              <text
                x={Number(x) + 105}
                y="79"
                textAnchor="middle"
                className="flow-node-title"
              >
                {label}
              </text>
              <text x={Number(x) + 105} y="110" textAnchor="middle">
                {detail}
              </text>
            </g>
          ))}
          <g className={`flow-node ${active('output') ? 'active' : ''}`}>
            <rect x="300" y="199" width="210" height="46" rx="8" />
            <text x="405" y="228" textAnchor="middle">
              O · Output: {m.output ?? '—'}
            </text>
          </g>
        </svg>
      </div>
      <p className="flow-route" aria-live="polite">
        {route}
      </p>
      <p className="flow-legend">
        Solid arrows carry instructions or numbers. The dashed arrow represents
        control; this simplified map groups the control signals to the organs.
        Highlighting marks the movement just completed. Previous step rewinds
        the teaching model, not the historical machine.
      </p>
    </section>
  );
}
