import { InboxIcon } from '@heroicons/react/24/outline';

export default function EmptyState({ title = 'لا توجد بيانات', subtitle = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="h-14 w-14 text-gray-300 mb-4" />
      <h3 className="text-gray-500 font-semibold text-lg">{title}</h3>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
