import clsx from 'clsx'
import { formatRep } from '../../lib/actions'

interface QueryHelpProps {
  open: boolean
  onToggle: () => void
  attackCost: number
  openInterest: number | null
}

export function QueryHelp({
  open,
  onToggle,
  attackCost,
  openInterest,
}: QueryHelpProps) {
  const unsafe =
    openInterest != null && openInterest > attackCost

  return (
    <div className="rounded-lg border border-border bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">
          Help: query creation & guarantees
        </span>
        <span
          className={clsx(
            'text-gray-400 transition-transform',
            open && 'rotate-90',
          )}
        >
          ▶
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 py-4 text-sm text-gray-600">
          <section>
            <h4 className="font-semibold text-gray-900">
              How query creation works
            </h4>
            <p className="mt-1">
              You pay a query fee in REP (or redeem a Query Token from the AMM
              when cheaper). Reporters stake REP on outcomes in an escalation
              game. After a 1-day appeal window with no further stake, the
              tentative outcome becomes final.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Guarantees</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                No multisig or admin key can override a resolution — only REP
                holders via the escalation / fork game.
              </li>
              <li>
                Incorrect resolution requires an attacker to win the full
                escalation game up through a fork.
              </li>
              <li>
                First correct reporter earns reporter pay (ramps to 100% of the
                fee over 3 days) plus any tip.
              </li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Attack cost</h4>
            <p className="mt-1">
              An attacker must stake roughly{' '}
              <strong className="text-gray-900">
                ${formatRep(attackCost)}
              </strong>{' '}
              (the fork bond, ~2% of REP supply) to force an incorrect
              resolution through a fork. Anything less can be appealed by honest
              reporters who profit from correcting it.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">
              When it is not safe to create a query
            </h4>
            <p className="mt-1">
              If total open interest secured by the oracle exceeds the attack
              cost, an attacker could profit from corrupting resolution. Check
              the Stats page for estimated open interest (via Dune) versus attack
              cost.
            </p>
            {unsafe ? (
              <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-900">
                Current estimated open interest (
                ${formatRep(openInterest!)}) exceeds attack cost (
                ${formatRep(attackCost)}). Do not create high-value queries
                until attack cost rises or open interest falls.
              </div>
            ) : (
              <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                Attack cost ${formatRep(attackCost)} currently exceeds estimated
                open interest
                {openInterest == null
                  ? ''
                  : ` ($${formatRep(openInterest)})`}
                . Creation is considered safe under this check.
              </div>
            )}
          </section>

          <section>
            <h4 className="font-semibold text-gray-900">Lesser benefits</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Optional tips in any ERC-20 to speed first reports</li>
              <li>Query Token AMM can undercut the protocol fee</li>
              <li>Fork migration keeps the same reporter UX</li>
              <li>Invalid outcome covers ambiguous or out-of-scope questions</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
