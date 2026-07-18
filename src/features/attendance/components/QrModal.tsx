import { X } from "lucide-react";
import { events, currentUser } from "../../../types/data";

export function QrModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const ev = events.find((e) => e.id === eventId);
  if (!ev) return null;
  const payload = `${currentUser.studentId}|${ev.id}|${btoa(ev.id + currentUser.id).slice(0, 8)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,28,28,0.45)" }} onClick={onClose}>
      <div className="rounded-2xl p-6 w-[340px]" style={{ background: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ fontSize: 11, color: "#6F6F6F" }}>Your check-in code</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1C" }}>{ev.title}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FAF8F2" }}>
            <X size={16} color="#1C1C1C" />
          </button>
        </div>
        <div className="rounded-xl p-4 flex items-center justify-center" style={{ background: "#FAF8F2" }}>
          <FakeQr seed={payload} />
        </div>
        <div className="mt-4 text-center" style={{ fontSize: 12, color: "#6F6F6F" }}>
          {currentUser.name} · {currentUser.yearLevel}
        </div>
        <div className="mt-1 text-center" style={{ fontSize: 11, color: "#CACACA" }}>{payload}</div>
        <div className="mt-4 rounded-xl px-3 py-2 text-center" style={{ background: "#F5A623", color: "#fff", fontSize: 12, fontWeight: 500 }}>
          Show this to the receptionist at the door
        </div>
      </div>
    </div>
  );
}

function FakeQr({ seed }: { seed: string }) {
  const size = 21;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h & 1) === 1);
  }
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderOn = (r: number, c: number) => {
    const local = (br: number, bc: number) => {
      const rr = r - br, cc = c - bc;
      if (rr < 0 || cc < 0 || rr > 6 || cc > 6) return false;
      const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
      const inner = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
      return edge || inner;
    };
    return local(0, 0) || local(0, size - 7) || local(size - 7, 0);
  };
  const px = 8;
  return (
    <svg width={size * px} height={size * px} viewBox={`0 0 ${size * px} ${size * px}`}>
      <rect width="100%" height="100%" fill="#fff" />
      {Array.from({ length: size * size }).map((_, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const on = isFinder(r, c) ? finderOn(r, c) : cells[i];
        if (!on) return null;
        return <rect key={i} x={c * px} y={r * px} width={px} height={px} fill="#1C1C1C" />;
      })}
    </svg>
  );
}
