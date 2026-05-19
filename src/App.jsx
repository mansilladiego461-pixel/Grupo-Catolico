import { useState, useMemo } from "react";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getAge(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function daysUntilBirthday(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / (1000 * 60 * 60 * 24));
}

function isBirthdayToday(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
}

const TABS = [
  { id: "asistencia", label: "Asistencia", icon: "📋" },
  { id: "cumpleanos", label: "Cumpleaños", icon: "🎂" },
  { id: "grupos", label: "Grupos", icon: "🙌" },
  { id: "oracion", label: "Oración", icon: "🕊️" },
  { id: "resumen", label: "Resumen", icon: "📊" },
  { id: "ninos", label: "Niños", icon: "👦" },
];

const GROUP_COLORS = ["#d4af37","#5a9a3a","#3a7ab0","#9a3a7a","#c4942a","#3a9a8a"];

export default function App() {
  const [kids, setKids] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [view, setView] = useState("asistencia");
  const [activeSession, setActiveSession] = useState(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newKid, setNewKid] = useState({ name: "", birthdate: "", phone: "" });
  const [newSession, setNewSession] = useState({ date: new Date().toISOString().split("T")[0], label: "", topic: "" });
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", color: "#d4af37" });
  const [prayers, setPrayers] = useState([{ id: 1, text: "Señor, guía a estos niños en tu camino.", month: "Mayo 2026" }]);
  const [newPrayer, setNewPrayer] = useState({ text: "", month: "" });
  const [exportModal, setExportModal] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const todayBirthdays = useMemo(() => kids.filter(k => k.birthdate && isBirthdayToday(k.birthdate)), [kids]);
  const upcomingBirthdays = useMemo(() =>
    kids.filter(k => k.birthdate && !isBirthdayToday(k.birthdate) && daysUntilBirthday(k.birthdate) <= 7)
      .sort((a, b) => daysUntilBirthday(a.birthdate) - daysUntilBirthday(b.birthdate)), [kids]);
  const sortedBirthdays = useMemo(() =>
    [...kids].filter(k => k.birthdate).sort((a, b) => daysUntilBirthday(a.birthdate) - daysUntilBirthday(b.birthdate)), [kids]);

  function addKid() {
    if (!newKid.name.trim()) return;
    setKids(prev => [...prev, { id: Date.now(), name: newKid.name.trim(), birthdate: newKid.birthdate, phone: newKid.phone.trim(), groupId: null }]);
    setNewKid({ name: "", birthdate: "", phone: "" });
  }

  function removeKid(id) {
    setKids(prev => prev.filter(k => k.id !== id));
    setAttendance(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(sid => { if (copy[sid]) delete copy[sid][id]; });
      return copy;
    });
  }

  function assignGroup(kidId, groupId) {
    setKids(prev => prev.map(k => k.id === kidId ? { ...k, groupId: k.groupId === groupId ? null : groupId } : k));
  }

  function addSession() {
    if (!newSession.date) return;
    const id = Date.now();
    setSessions(prev => [...prev, { id, date: newSession.date, label: newSession.label || `Encuentro ${prev.length + 1}`, topic: newSession.topic }]);
    setAttendance(prev => ({ ...prev, [id]: {} }));
    setNewSession({ date: new Date().toISOString().split("T")[0], label: "", topic: "" });
    setShowAddSession(false);
    setActiveSession(id);
  }

  function toggleAttendance(sessionId, kidId) {
    setAttendance(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], [kidId]: !prev[sessionId]?.[kidId] } }));
  }

  function getAttendancePercent(kidId) {
    if (sessions.length === 0) return 0;
    const count = sessions.filter(s => attendance[s.id]?.[kidId]).length;
    return Math.round((count / sessions.length) * 100);
  }

  function buildWhatsAppText(sessionId) {
    const s = sessions.find(x => x.id === sessionId);
    if (!s) return "";
    const fecha = new Date(s.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const presentes = kids.filter(k => attendance[sessionId]?.[k.id]);
    const ausentes = kids.filter(k => !attendance[sessionId]?.[k.id]);
    let txt = `✝ *${s.label}*\n📅 ${fecha}\n`;
    if (s.topic) txt += `📖 Tema: ${s.topic}\n`;
    txt += `\n✅ *Presentes (${presentes.length})*\n`;
    presentes.forEach((k, i) => { txt += `${i + 1}. ${k.name}\n`; });
    txt += `\n❌ *Ausentes (${ausentes.length})*\n`;
    ausentes.forEach((k, i) => { txt += `${i + 1}. ${k.name}\n`; });
    return txt;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    });
  }

  function addGroup() {
    if (!newGroup.name.trim()) return;
    setGroups(prev => [...prev, { id: Date.now(), name: newGroup.name.trim(), color: newGroup.color }]);
    setNewGroup({ name: "", color: "#d4af37" });
  }

  function addPrayer() {
    if (!newPrayer.text.trim()) return;
    setPrayers(prev => [...prev, { id: Date.now(), text: newPrayer.text.trim(), month: newPrayer.month }]);
    setNewPrayer({ text: "", month: "" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9f6ee", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#2a2000" }}>
      <div style={{ position: "fixed", inset: 0, opacity: 0.06, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg,#c9a800 0,#c9a800 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#c9a800 0,#c9a800 1px,transparent 0,transparent 50%)", backgroundSize: "40px 40px" }} />

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg,#f5c800 0%,#e6b800 100%)", borderBottom: "3px solid #b89000", padding: "14px 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>✝</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "19px", color: "#3a2800", letterSpacing: "2px", fontVariant: "small-caps" }}>Grupo Católico</h1>
            <p style={{ margin: 0, fontSize: "10px", color: "#7a5a00" }}>Asistencias · Cumpleaños · Grupos · Oración</p>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "11px", color: "#7a5a00", textAlign: "right" }}>
            <div>{kids.length} niños</div>
            <div>{sessions.length} encuentros</div>
          </div>
        </div>
        {todayBirthdays.length > 0 && (
          <div style={{ marginTop: "9px", background: "#fff8cc", border: "1px solid #b89000", borderRadius: "8px", padding: "7px 12px", display: "flex", alignItems: "center", gap: "7px" }}>
            <span>🎉</span>
            <span style={{ color: "#3a2800", fontSize: "12px" }}>¡Hoy cumple <strong>{todayBirthdays.map(k => k.name).join(", ")}</strong>!</span>
          </div>
        )}
        {upcomingBirthdays.length > 0 && (
          <div style={{ marginTop: "5px", background: "#fffbe0", border: "1px solid #d4b800", borderRadius: "8px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "14px" }}>🎈</span>
            <span style={{ color: "#5a4000", fontSize: "11px" }}>{upcomingBirthdays.map(k => `${k.name} (${daysUntilBirthday(k.birthdate)}d)`).join(" · ")}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "2px solid #e6c800", background: "#fff8cc", scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            flexShrink: 0, minWidth: "58px", padding: "9px 8px 7px", background: "none", border: "none",
            borderBottom: view === tab.id ? "3px solid #b89000" : "3px solid transparent",
            color: view === tab.id ? "#3a2800" : "#9a8040", fontSize: "10px", cursor: "pointer",
            fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            fontWeight: view === tab.id ? "bold" : "normal"
          }}>
            <span style={{ fontSize: "15px" }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px", maxWidth: "600px", margin: "0 auto", paddingBottom: "50px" }}>

        {/* ASISTENCIA */}
        {view === "asistencia" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={S.title}>Encuentros</h2>
              <button onClick={() => setShowAddSession(v => !v)} style={S.btnPrimary}>+ Nuevo</button>
            </div>
            {showAddSession && (
              <div style={S.card}>
                <p style={S.cardTitle}>Nuevo Encuentro</p>
                <input type="date" value={newSession.date} onChange={e => setNewSession(p => ({ ...p, date: e.target.value }))} style={S.input} />
                <input placeholder="Nombre del encuentro" value={newSession.label} onChange={e => setNewSession(p => ({ ...p, label: e.target.value }))} style={{ ...S.input, marginTop: "6px" }} />
                <input placeholder="📖 Tema o actividad" value={newSession.topic} onChange={e => setNewSession(p => ({ ...p, topic: e.target.value }))} style={{ ...S.input, marginTop: "6px" }} />
                <div style={{ display: "flex", gap: "7px", marginTop: "9px" }}>
                  <button onClick={addSession} style={S.btnPrimary}>Crear</button>
                  <button onClick={() => setShowAddSession(false)} style={S.btnSec}>Cancelar</button>
                </div>
              </div>
            )}
            {sessions.length === 0 && <Empty icon="📅" text="No hay encuentros registrados." />}
            {[...sessions].reverse().map(s => {
              const pCount = Object.values(attendance[s.id] || {}).filter(Boolean).length;
              const open = activeSession === s.id;
              return (
                <div key={s.id} style={{ ...S.card, border: `1px solid ${open ? "#b89000" : "#e8d870"}`, cursor: "pointer", marginBottom: "9px", background: open ? "#fffbe6" : "#ffffff" }}
                  onClick={() => setActiveSession(open ? null : s.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", color: open ? "#7a5500" : "#2a2000", fontWeight: open ? "bold" : "normal" }}>{s.label}</div>
                      <div style={{ fontSize: "11px", color: "#9a8040", marginTop: "2px" }}>
                        {new Date(s.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
                      {s.topic && <div style={{ fontSize: "11px", color: "#b89000", marginTop: "2px" }}>📖 {s.topic}</div>}
                    </div>
                    <div style={{ textAlign: "right", marginLeft: "8px" }}>
                      <div style={{ fontSize: "22px", color: "#b89000", fontWeight: "bold", lineHeight: 1 }}>{pCount}</div>
                      <div style={{ fontSize: "10px", color: "#9a8040" }}>presentes</div>
                    </div>
                  </div>
                  {open && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: "10px", borderTop: "1px solid #e8d870", paddingTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#9a8040" }}>{pCount} de {kids.length} presentes</span>
                        <button onClick={() => setExportModal(s.id)} style={{ ...S.btnSec, padding: "4px 9px", fontSize: "11px" }}>📤 Exportar WSP</button>
                      </div>
                      {kids.length === 0 && <p style={{ color: "#b8a060", fontSize: "12px" }}>Agregá niños en la pestaña "Niños".</p>}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                        {kids.map(k => {
                          const present = attendance[s.id]?.[k.id];
                          const grp = groups.find(g => g.id === k.groupId);
                          return (
                            <button key={k.id} onClick={() => toggleAttendance(s.id, k.id)} style={{
                              background: present ? "#e8f5e0" : "#fafafa", border: `1px solid ${present ? "#7ab840" : "#e8d870"}`,
                              borderRadius: "8px", padding: "6px 9px", color: present ? "#3a7010" : "#9a8040",
                              fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                              display: "flex", alignItems: "center", gap: "5px", textAlign: "left", transition: "all 0.15s"
                            }}>
                              <span>{present ? "✅" : "⬜"}</span>
                              <div style={{ overflow: "hidden", flex: 1 }}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.name}</div>
                                {grp && <div style={{ fontSize: "9px", color: grp.color }}>● {grp.name}</div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CUMPLEAÑOS */}
        {view === "cumpleanos" && (
          <div>
            <h2 style={S.title}>Cumpleaños del Grupo</h2>
            {sortedBirthdays.length === 0 && <Empty icon="🎂" text="No hay fechas de cumpleaños cargadas." />}
            {sortedBirthdays.map(k => {
              const days = daysUntilBirthday(k.birthdate);
              const isToday = days === 0;
              const soon = days <= 7;
              const birth = new Date(k.birthdate + "T12:00:00");
              return (
                <div key={k.id} style={{ background: isToday ? "#fff8cc" : "#ffffff", border: `1px solid ${isToday ? "#b89000" : soon ? "#e6c800" : "#e8d870"}`, borderRadius: "10px", padding: "11px 13px", marginBottom: "7px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 1px 3px #e6c80020" }}>
                  <div style={{ fontSize: "22px" }}>{isToday ? "🎉" : soon ? "🎈" : "🎂"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: isToday ? "#7a5500" : "#2a2000", fontWeight: isToday ? "bold" : "normal" }}>{k.name}</div>
                    <div style={{ fontSize: "11px", color: "#9a8040", marginTop: "1px" }}>{birth.getDate()} de {MONTHS[birth.getMonth()]} · {getAge(k.birthdate)} años</div>
                    {k.phone && <div style={{ fontSize: "11px", color: "#4a7a9a", marginTop: "1px" }}>📱 {k.phone}</div>}
                  </div>
                  <div style={{ fontSize: "12px", color: isToday ? "#b89000" : soon ? "#c4942a" : "#b8a060", fontWeight: isToday ? "bold" : "normal" }}>
                    {isToday ? "¡HOY!" : `en ${days}d`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GRUPOS */}
        {view === "grupos" && (
          <div>
            <h2 style={S.title}>Grupos Pequeños</h2>
            <div style={S.card}>
              <p style={S.cardTitle}>Nuevo Grupo</p>
              <input placeholder="Nombre del grupo (ej: Los Apóstoles)" value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))} style={S.input} />
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {GROUP_COLORS.map(c => (
                  <div key={c} onClick={() => setNewGroup(p => ({ ...p, color: c }))} style={{ width: "22px", height: "22px", borderRadius: "50%", background: c, cursor: "pointer", border: newGroup.color === c ? "3px solid #fff" : "2px solid transparent", transition: "all 0.15s" }} />
                ))}
              </div>
              <button onClick={addGroup} style={{ ...S.btnPrimary, marginTop: "9px" }}>+ Crear grupo</button>
            </div>
            {groups.length === 0 && <Empty icon="🙌" text="No hay grupos creados todavía." />}
            {groups.map(g => {
              const members = kids.filter(k => k.groupId === g.id);
              const unassigned = kids.filter(k => !k.groupId);
              return (
                <div key={g.id} style={{ ...S.card, borderLeft: `3px solid ${g.color}`, marginBottom: "9px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: g.color, fontVariant: "small-caps", fontWeight: "bold" }}>● {g.name}</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#9a8040" }}>{members.length} miembros</span>
                      <button onClick={() => { setGroups(p => p.filter(x => x.id !== g.id)); setKids(p => p.map(k => k.groupId === g.id ? { ...k, groupId: null } : k)); }} style={{ background: "none", border: "none", color: "#c04040", cursor: "pointer", fontSize: "16px" }}>×</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: members.length ? "8px" : 0 }}>
                    {members.map(k => (
                      <span key={k.id} onClick={() => assignGroup(k.id, g.id)} style={{ background: g.color + "22", border: `1px solid ${g.color}88`, borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: g.color, cursor: "pointer", fontWeight: "bold" }}>
                        {k.name} ×
                      </span>
                    ))}
                  </div>
                  {unassigned.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", color: "#b8a060", marginBottom: "4px" }}>Agregar al grupo:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {unassigned.map(k => (
                          <span key={k.id} onClick={() => assignGroup(k.id, g.id)} style={{ background: "#fffbe0", border: "1px solid #e6c800", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: "#7a5500", cursor: "pointer" }}>+ {k.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {kids.filter(k => !k.groupId).length > 0 && groups.length > 0 && (
              <div style={{ ...S.card, borderLeft: "3px solid #e6c800" }}>
                <div style={{ fontSize: "12px", color: "#9a8040", fontVariant: "small-caps", marginBottom: "7px" }}>Sin grupo asignado</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {kids.filter(k => !k.groupId).map(k => (
                    <span key={k.id} style={{ background: "#fffbe0", border: "1px solid #e6c800", borderRadius: "20px", padding: "3px 9px", fontSize: "11px", color: "#9a8040" }}>{k.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORACIÓN */}
        {view === "oracion" && (
          <div>
            <h2 style={S.title}>Intención de Oración</h2>
            <div style={S.card}>
              <p style={S.cardTitle}>Nueva Intención</p>
              <textarea placeholder="Escribe la intención de oración del mes..." value={newPrayer.text} onChange={e => setNewPrayer(p => ({ ...p, text: e.target.value }))} style={{ ...S.input, minHeight: "75px", resize: "vertical" }} />
              <input placeholder="Mes (ej: Junio 2026)" value={newPrayer.month} onChange={e => setNewPrayer(p => ({ ...p, month: e.target.value }))} style={{ ...S.input, marginTop: "6px" }} />
              <button onClick={addPrayer} style={{ ...S.btnPrimary, marginTop: "9px", width: "100%" }}>+ Agregar intención</button>
            </div>
            {prayers.length === 0 && <Empty icon="🕊️" text="No hay intenciones de oración cargadas." />}
            {prayers.map(p => (
              <div key={p.id} style={{ ...S.card, borderLeft: "3px solid #f5c800", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    {p.month && <div style={{ fontSize: "10px", color: "#9a8040", marginBottom: "5px", fontVariant: "small-caps" }}>🕊️ {p.month}</div>}
                    <p style={{ margin: 0, fontSize: "13px", color: "#3a2800", lineHeight: 1.6, fontStyle: "italic" }}>"{p.text}"</p>
                  </div>
                  <button onClick={() => setPrayers(prev => prev.filter(x => x.id !== p.id))} style={{ background: "none", border: "none", color: "#c04040", cursor: "pointer", fontSize: "16px", marginLeft: "8px" }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESUMEN */}
        {view === "resumen" && (
          <div>
            <h2 style={S.title}>Resumen de Asistencia</h2>
            {kids.length === 0 && <Empty icon="📊" text="Aún no hay niños registrados." />}
            {kids.map(k => {
              const pct = getAttendancePercent(k.id);
              const count = sessions.filter(s => attendance[s.id]?.[k.id]).length;
              const grp = groups.find(g => g.id === k.groupId);
              return (
                <div key={k.id} style={{ ...S.card, marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "#2a2000" }}>{k.name}</span>
                      {grp && <span style={{ fontSize: "10px", color: grp.color, marginLeft: "6px", fontWeight: "bold" }}>● {grp.name}</span>}
                    </div>
                    <span style={{ fontSize: "12px", color: "#9a8040" }}>{sessions.length === 0 ? "—" : `${count}/${sessions.length} (${pct}%)`}</span>
                  </div>
                  {sessions.length > 0 && (
                    <div style={{ height: "5px", background: "#f0e890", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${pct}%`, background: pct >= 75 ? "#5a9a3a" : pct >= 50 ? "#c4942a" : "#c04040", transition: "width 0.5s" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* NIÑOS */}
        {view === "ninos" && (
          <div>
            <h2 style={S.title}>Niños del Grupo</h2>
            <div style={S.card}>
              <p style={S.cardTitle}>Agregar Niño/a</p>
              <input placeholder="Nombre y apellido" value={newKid.name} onChange={e => setNewKid(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && addKid()} style={S.input} />
              <input placeholder="📱 Teléfono de contacto (padres)" value={newKid.phone} onChange={e => setNewKid(p => ({ ...p, phone: e.target.value }))} style={{ ...S.input, marginTop: "6px" }} />
              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "7px" }}>
                <label style={{ fontSize: "11px", color: "#a08060", whiteSpace: "nowrap" }}>Nacimiento:</label>
                <input type="date" value={newKid.birthdate} onChange={e => setNewKid(p => ({ ...p, birthdate: e.target.value }))} style={{ ...S.input, flex: 1 }} />
              </div>
              <button onClick={addKid} style={{ ...S.btnPrimary, marginTop: "9px", width: "100%" }}>+ Agregar al grupo</button>
            </div>
            {kids.length === 0 && <Empty icon="👦" text="Todavía no hay niños en el grupo." />}
            {kids.map((k, i) => {
              const grp = groups.find(g => g.id === k.groupId);
              return (
                <div key={k.id} style={{ ...S.card, marginBottom: "6px", display: "flex", alignItems: "center", gap: "9px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f5c800", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a2800", fontSize: "11px", fontWeight: "bold", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: "#2a2000" }}>{k.name}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                      {k.birthdate && <span style={{ fontSize: "10px", color: "#9a8040" }}>🎂 {new Date(k.birthdate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · {getAge(k.birthdate)}a</span>}
                      {k.phone && <span style={{ fontSize: "10px", color: "#4a7a9a" }}>📱 {k.phone}</span>}
                      {grp && <span style={{ fontSize: "10px", color: grp.color, fontWeight: "bold" }}>● {grp.name}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeKid(k.id)} style={{ background: "none", border: "1px solid #f0c0c0", borderRadius: "6px", color: "#c04040", padding: "2px 7px", cursor: "pointer", fontSize: "15px" }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {exportModal && (
        <div style={{ position: "fixed", inset: 0, background: "#0005", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={() => setExportModal(null)}>
          <div style={{ background: "#fffbe6", border: "2px solid #e6c800", borderRadius: "16px 16px 0 0", padding: "18px", width: "100%", maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ color: "#7a5500", fontSize: "14px", fontVariant: "small-caps", fontWeight: "bold" }}>📤 Lista para WhatsApp</span>
              <button onClick={() => setExportModal(null)} style={{ background: "none", border: "none", color: "#9a8040", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <pre style={{ background: "#ffffff", border: "1px solid #e6c800", borderRadius: "8px", padding: "10px", fontSize: "11px", color: "#2a2000", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "280px", overflowY: "auto", fontFamily: "monospace", margin: 0 }}>
              {buildWhatsAppText(exportModal)}
            </pre>
            <button onClick={() => copyToClipboard(buildWhatsAppText(exportModal))} style={{ ...S.btnPrimary, width: "100%", marginTop: "10px" }}>
              {copiedMsg ? "✅ ¡Copiado!" : "📋 Copiar al portapapeles"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 20px", color: "#b8a060" }}>
      <div style={{ fontSize: "34px", marginBottom: "7px" }}>{icon}</div>
      <p style={{ margin: 0, fontSize: "12px" }}>{text}</p>
    </div>
  );
}

const S = {
  input: { width: "100%", background: "#ffffff", border: "1px solid #e6c800", borderRadius: "8px", padding: "8px 11px", color: "#2a2000", fontSize: "13px", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box" },
  card: { background: "#ffffff", border: "1px solid #e8d870", borderRadius: "10px", padding: "13px", boxShadow: "0 1px 4px #e6c80030" },
  title: { margin: "0 0 12px", fontSize: "15px", color: "#7a5500", fontVariant: "small-caps" },
  cardTitle: { margin: "0 0 9px", color: "#7a5500", fontSize: "12px", fontVariant: "small-caps" },
  btnPrimary: { background: "#f5c800", color: "#2a1800", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: "bold", boxShadow: "0 2px 6px #e6c80060" },
  btnSec: { background: "#fffbe0", color: "#7a5500", border: "1px solid #e6c800", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" },
};
