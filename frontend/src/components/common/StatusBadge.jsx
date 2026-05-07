const MAP = {
  pending:  { label: 'قيد الانتظار', cls: 'badge-pending' },
  approved: { label: 'موافق عليه',   cls: 'badge-approved' },
  rejected: { label: 'مرفوض',        cls: 'badge-rejected' },
  active:   { label: 'نشط',           cls: 'badge-active'   },
  inactive: { label: 'غير نشط',      cls: 'badge-rejected' },
  present:  { label: 'حاضر',          cls: 'badge-present'  },
  absent:   { label: 'غائب',          cls: 'badge-absent'   },
  excused:  { label: 'معذور',         cls: 'badge-excused'  },
  excellent:{ label: 'ممتاز',         cls: 'badge-active'   },
  good:     { label: 'جيد',           cls: 'badge-approved' },
  average:  { label: 'متوسط',         cls: 'badge-pending'  },
  poor:     { label: 'ضعيف',          cls: 'badge-rejected' },
  hifz:     { label: 'حفظ',           cls: 'badge-approved' },
  muraja3a: { label: 'مراجعة',        cls: 'badge-pending'  },
};

export default function StatusBadge({ status }) {
  const { label, cls } = MAP[status] || { label: status, cls: 'badge-pending' };
  return <span className={cls}>{label}</span>;
}
