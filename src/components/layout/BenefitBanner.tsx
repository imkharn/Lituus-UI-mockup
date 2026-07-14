interface Benefit {
  text: string
  emphasis: string
}

interface BenefitBannerProps {
  variant: 'report' | 'query'
  benefits: Benefit[]
  onLearnMore: () => void
}

export function BenefitBanner({
  benefits,
  onLearnMore,
}: BenefitBannerProps) {
  return (
    <div className="border-b border-sky-100 bg-sky-50/80">
      <div className="flex flex-col items-center gap-2 px-4 py-4 text-center sm:px-6 lg:px-8">
        <ul className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-1">
          {benefits.map((b) => (
            <li key={b.text} className="text-sm text-gray-700">
              {b.text.split(b.emphasis).map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={i}>
                    {part}
                    <strong className="font-semibold text-gray-900">
                      {b.emphasis}
                    </strong>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onLearnMore}
          className="text-sm font-medium text-gray-900 underline-offset-2 hover:underline"
        >
          See all benefits →
        </button>
      </div>
    </div>
  )
}
