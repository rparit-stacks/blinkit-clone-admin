const variants: Record<string, string> = {
  success:  "bg-green-100 text-green-700",
  warning:  "bg-yellow-100 text-yellow-700",
  danger:   "bg-red-100 text-red-700",
  info:     "bg-blue-100 text-blue-700",
  default:  "bg-slate-100 text-slate-600",
  purple:   "bg-purple-100 text-purple-700",
};

export default function Badge({ label, variant = "default" }: { label: string; variant?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${variants[variant] ?? variants.default}`}>
      {label}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: string }> = {
    PENDING:    { label: "Pending",    variant: "warning"  },
    PROCESSING: { label: "Processing", variant: "info"     },
    DISPATCHED: { label: "Dispatched", variant: "purple"   },
    DELIVERED:  { label: "Delivered",  variant: "success"  },
    CANCELLED:  { label: "Cancelled",  variant: "danger"   },
    PAID:       { label: "Paid",       variant: "success"  },
    BLOCKED:    { label: "Blocked",    variant: "danger"   },
    CUSTOMER:   { label: "Customer",   variant: "default"  },
    APPROVED:   { label: "Approved",   variant: "success"  },
    ACTIVE:     { label: "Active",     variant: "success"  },
    INACTIVE:   { label: "Inactive",   variant: "default"  },
    PERCENT:    { label: "%",          variant: "purple"   },
    FLAT:       { label: "Flat ₹",     variant: "info"     },
  };
  const entry = map[status?.toUpperCase()] ?? { label: status, variant: "default" };
  return <Badge label={entry.label} variant={entry.variant} />;
}
