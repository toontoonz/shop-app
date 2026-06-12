import type { OrderStatusEvent } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";

type Props = {
  events: OrderStatusEvent[];
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function StatusTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">ยังไม่มีประวัติการเปลี่ยนสถานะ</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">ประวัติสถานะ</h3>
      <ol className="relative border-l border-gray-200 pl-4">
        {events.map((event) => (
          <li key={event.id} className="mb-4 last:mb-0">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />
            <div className="flex items-center gap-2">
              {event.fromStatus && (
                <>
                  <StatusBadge status={event.fromStatus} />
                  <span className="text-gray-400">→</span>
                </>
              )}
              <StatusBadge status={event.toStatus} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatDate(event.occurredAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
