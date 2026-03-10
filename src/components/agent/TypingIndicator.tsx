export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2.5 flex-shrink-0">
      {[0, 200, 400].map((delay, i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] bg-pv-gray rounded-full animate-typingDot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}
