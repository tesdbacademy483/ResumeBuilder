const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthYear(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function dateRange(start, end, isCurrent) {
  return `${monthYear(start)} – ${isCurrent ? "Present" : monthYear(end)}`;
}

export function timeAgo(iso) {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days} days ago` : new Date(iso).toLocaleDateString();
}
