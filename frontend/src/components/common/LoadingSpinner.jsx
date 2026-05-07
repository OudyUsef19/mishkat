export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeMap = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeMap[size]} border-4 border-navy-200 border-t-navy-800 rounded-full animate-spin`} />
      {text && <p className="text-navy-600 text-sm">{text}</p>}
    </div>
  );
}
