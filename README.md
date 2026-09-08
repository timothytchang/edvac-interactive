# EDVAC · The Stored Program

An interactive lesson following the **1945 First Draft** as described in Thomas Haigh and Paul Ceruzzi, *A New History of Modern Computing*, pp. 15–17.

Live site: https://timothytchang.github.io/edvac-interactive/

## Activities

- Explore the five logical organs and the external recording medium.
- Step through fetch, decode, and execute while observing memory, the program counter, ICA, JCA, and OCA.
- Change input data or arithmetic instructions; predict the output.
- Replace an instruction with a branch and observe the changed execution order.
- Explore the waiting time in a conceptual eight-word acoustic delay line.

## Historical scope

The main simulation follows the proposal's sequential instruction stream and register transfers. It is a teaching model, not a bit-exact emulator. It uses 24 typed cells, readable commands, and small integers. Instruction encodings, fixed-point arithmetic, overflow rules, electrical implementation, and actual timing are omitted. The delay-line activity illustrates physical storage associated with later built EDVAC, which used 44-bit words and four-address instructions. This distinction is explicit in the lesson.

Sources are linked in the page. No private notes or learner data are sent to a server.

## Development

Requires Node 24+ and pnpm. Install with `pnpm install`, then `pnpm run dev`. Dependency lifecycle scripts are disabled by the workspace policy; the static build needs no Cloudflare runtime. The frontend-only Vite build uses relative asset URLs, so the same output works locally and under the GitHub Pages repository prefix.

Run `node --experimental-strip-types --test tests/machine.test.mjs` for the simulator checks and `pnpm exec tsc --noEmit` for type checking. Run `pnpm run build` to export the site to `dist/client/`.

GitHub Pages publishes the checked-in `docs/` directory on `main`. To publish an update, run `pnpm run build` and `pnpm run prepare-pages`, then commit source and exported site together.

Optional WebMCP tools use the same visible simulator state in supporting browsers. Unsupported browsers retain all manual interactions.
