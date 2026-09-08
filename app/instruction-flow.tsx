import { type Machine } from '@/lib/machine';

export function InstructionFlow({
  machine: m,
  lastStage,
}: {
  machine: Machine;
  lastStage: number;
}) {
  const op = m.ir?.op;
  const execute = lastStage === 2 && !m.error;
  const fetch = lastStage === 0 && !m.error;
  const decode = lastStage === 1 && !m.error;
  const arithmetic = execute && ['ADD', 'SUB', 'MUL'].includes(op ?? '');
  const edge = (active: boolean) => `flow-edge ${active ? 'active' : ''}`;
  const node = (active: boolean) => `flow-node ${active ? 'active' : ''}`;
  return (
    <section className="compact-flow" aria-label="Live instruction flow">
      <h3>Instruction flow</h3>
      <svg
        viewBox="0 0 350 325"
        className="compact-map"
        role="img"
        aria-label={`Highlighted operation: ${m.error ? 'error' : lastStage < 0 ? 'ready' : fetch ? 'fetch to control' : decode ? 'decode in control' : op}`}
      >
        <defs>
          <marker
            id="flow-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        <path
          className={edge(fetch)}
          d="M65 130 V45 H115"
          markerEnd="url(#flow-arrow)"
        />
        <text x="22" y="92">
          fetch
        </text>
        <path
          className={`${edge(decode)} control`}
          d="M235 45 H285 V130"
          markerEnd="url(#flow-arrow)"
        />
        <text x="273" y="92">
          control
        </text>
        <path
          className={edge(execute && op === 'READ')}
          d="M130 151 H220"
          markerEnd="url(#flow-arrow)"
        />
        <text x="175" y="143" textAnchor="middle">
          READ
        </text>
        <path
          className={edge(execute && op === 'WRITE')}
          d="M220 195 H130"
          markerEnd="url(#flow-arrow)"
        />
        <text x="175" y="216" textAnchor="middle">
          WRITE
        </text>
        <path
          className={edge(execute && op === 'OUT')}
          d="M65 220 V273 H115"
          markerEnd="url(#flow-arrow)"
        />
        <text x="24" y="251">
          OUT
        </text>
        <g
          className={node(
            fetch || decode || (execute && (op === 'JMP' || op === 'HALT')),
          )}
        >
          <rect x="115" y="15" width="120" height="60" rx="7" />
          <text x="175" y="40" textAnchor="middle" className="flow-node-title">
            CC
          </text>
          <text x="175" y="61" textAnchor="middle">
            Control
          </text>
        </g>
        <g
          className={node(
            fetch || (execute && ['READ', 'WRITE', 'OUT'].includes(op ?? '')),
          )}
        >
          <rect x="10" y="130" width="120" height="90" rx="7" />
          <text x="70" y="165" textAnchor="middle" className="flow-node-title">
            M
          </text>
          <text x="70" y="188" textAnchor="middle">
            Memory
          </text>
        </g>
        <g
          className={node(
            arithmetic || (execute && ['READ', 'WRITE'].includes(op ?? '')),
          )}
        >
          <rect x="220" y="130" width="120" height="90" rx="7" />
          <text x="280" y="165" textAnchor="middle" className="flow-node-title">
            CA
          </text>
          <text x="280" y="188" textAnchor="middle">
            Arithmetic
          </text>
        </g>
        <g className={node(execute && op === 'OUT')}>
          <rect x="115" y="245" width="120" height="60" rx="7" />
          <text x="175" y="270" textAnchor="middle" className="flow-node-title">
            O
          </text>
          <text x="175" y="291" textAnchor="middle">
            Output
          </text>
        </g>
      </svg>
      <p className="compact-legend">Solid: information · Dashed: control</p>
      <dl className="register-strip">
        {[
          ['JCA', m.right],
          ['ICA', m.left],
          ['OCA', m.result],
          ['Output', m.output],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
