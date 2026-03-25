import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import AuditChatbot from "./AuditChatbot";

const PAGE_SIZE = 15;
const ACTION_COLOR = { CREATE:"green", MODIFY:"blue", DELETE:"red" };

function exportPDF(rows) {
  import("jspdf").then(({ jsPDF }) => {
    import("jspdf-autotable").then(({ default: autoTable }) => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("SecureEHR — Audit Log Export", 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [["Patient ID","Patient Name","Action","Diagnosis","Medication","Doctor","Date"]],
        body: rows.map(r => [
          r.patient_id, r.patient_name||"—", r.action,
          r.diagnosis||"—", r.medication||"—", r.user_id,
          new Date(r.timestamp).toLocaleDateString()
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 82, 204] },
      });
      doc.save("secureehr-audit-log.pdf");
    });
  });
}

export default function ViewLogs() {
  const navigate = useNavigate();
  const userId   = localStorage.getItem("user_id");
  const role     = localStorage.getItem("role");

  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("ALL");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage]       = useState(1);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!userId) { navigate("/"); return; }
    api.get("/api/audit/logs", { params: { role, user_id: userId } })
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
  }, [userId, role, navigate]);

  const filtered = useMemo(() => {
    let rows = [...logs];
    if (filter !== "ALL") rows = rows.filter(r => r.action === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.patient_name||"").toLowerCase().includes(q) ||
        (r.patient_id  ||"").toLowerCase().includes(q) ||
        (r.diagnosis   ||"").toLowerCase().includes(q) ||
        (r.medication  ||"").toLowerCase().includes(q)
      );
    }
    rows.sort((a,b) => sortDesc
      ? new Date(b.timestamp)-new Date(a.timestamp)
      : new Date(a.timestamp)-new Date(b.timestamp)
    );
    return rows;
  }, [logs, filter, search, sortDesc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function handleSearch(val) { setSearch(val); setPage(1); }
  function handleFilter(f)   { setFilter(f);  setPage(1); }

  return (
    <div className="ehr-shell">
      <Sidebar activeItem="logs" />
      <main className="ehr-main">
        <div className="ehr-topbar">
          <div className="ehr-breadcrumb">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <i className="bi bi-chevron-right" style={{ fontSize:10 }} />
            <span>Audit Logs</span>
          </div>
          <div className="ehr-topbar-title" />
          <div style={{ display:"flex", gap:8 }}>
            <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => exportPDF(filtered)}>
              <i className="bi bi-download" /> Export PDF
            </button>
            {role === "doctor" && (
              <button className="ehr-btn ehr-btn-primary ehr-btn-sm" onClick={() => navigate("/add")}>
                <i className="bi bi-plus-lg" /> Add Record
              </button>
            )}
          </div>
        </div>

        <div className="ehr-content">
          <div className="ehr-page-header">
            <div className="ehr-page-title">Audit Logs</div>
            <div className="ehr-page-sub">{filtered.length} record{filtered.length!==1?"s":""} · encrypted at rest · hash-chained</div>
          </div>

          {error && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{error}</div>}

          {/* Controls */}
          <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            <div className="ehr-search-bar" style={{ flex:1, minWidth:220 }}>
              <i className="bi bi-search" />
              <input placeholder="Search patient, diagnosis, medication…" value={search} onChange={e => handleSearch(e.target.value)} />
              {search && <button onClick={() => handleSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16, padding:0, display:"flex" }}><i className="bi bi-x" /></button>}
            </div>

            <div style={{ display:"flex", gap:6 }}>
              {["ALL","CREATE","MODIFY","DELETE"].map(f => (
                <button key={f} onClick={() => handleFilter(f)}
                  className={`ehr-btn ehr-btn-sm ${filter===f ? "ehr-btn-primary" : "ehr-btn-ghost"}`}>
                  {f}
                </button>
              ))}
            </div>

            <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => setSortDesc(d => !d)}>
              <i className={`bi bi-sort-${sortDesc?"down":"up"}`} />
              {sortDesc ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>
              <div className="ehr-spinner ehr-spinner-dark" style={{ margin:"0 auto 12px" }} />
              Loading encrypted records…
            </div>
          ) : filtered.length === 0 ? (
            <div className="ehr-empty">
              <div className="ehr-empty-icon"><i className="bi bi-journal-x" /></div>
              <div className="ehr-empty-title">{search || filter !== "ALL" ? "No matching records" : "No records yet"}</div>
              <div className="ehr-empty-sub">{search || filter !== "ALL" ? "Try a different search or filter." : "Records you add will appear here."}</div>
              {!search && filter === "ALL" && role === "doctor" && (
                <button className="ehr-btn ehr-btn-primary" onClick={() => navigate("/add")}><i className="bi bi-plus-lg" /> Add First Record</button>
              )}
            </div>
          ) : (
            <>
              <div className="ehr-table-wrap">
                <table className="ehr-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Action</th>
                      <th>Diagnosis</th>
                      <th>Medication</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(log => (
                      <React.Fragment key={log.id}>
                        <tr onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                          <td>
                            <div style={{ fontWeight:500 }}>{log.patient_name || <span style={{ color:"var(--text-disabled)" }}>—</span>}</div>
                            <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{log.patient_id}</div>
                          </td>
                          <td><span className={`ehr-badge ehr-badge-${ACTION_COLOR[log.action]||"gray"}`}>{log.action}</span></td>
                          <td style={{ maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.diagnosis || <span style={{ color:"var(--text-disabled)" }}>—</span>}</td>
                          <td style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.medication || <span style={{ color:"var(--text-disabled)" }}>—</span>}</td>
                          <td style={{ fontSize:13, color:"var(--text-muted)" }}>{log.user_id}</td>
                          <td style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap" }}>
                            {new Date(log.timestamp).toLocaleDateString()}
                          </td>
                          <td>
                            <i className={`bi bi-chevron-${expanded===log.id?"up":"down"}`} style={{ color:"var(--text-muted)", fontSize:12 }} />
                          </td>
                        </tr>
                        {expanded === log.id && (
                          <tr>
                            <td colSpan={7} style={{ background:"var(--bg)", padding:"0 18px" }}>
                              <div style={{ padding:"16px 0", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                                <div>
                                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Age / Gender</div>
                                  <div style={{ fontSize:14 }}>{log.age ? `${log.age} yrs` : "—"} · {log.gender || "—"}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Visit Date</div>
                                  <div style={{ fontSize:14 }}>{log.visit_date || "—"}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Vitals</div>
                                  <div style={{ fontSize:14 }}>{log.vitals || "—"}</div>
                                </div>
                                <div style={{ gridColumn:"span 3" }}>
                                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Notes</div>
                                  <div style={{ fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{log.notes || <span style={{ color:"var(--text-disabled)" }}>No notes recorded.</span>}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Log ID</div>
                                  <div style={{ fontSize:12, fontFamily:"var(--font-mono)", color:"var(--text-muted)" }}>{log.id}</div>
                                </div>
                                <div style={{ gridColumn:"span 2", display:"flex", gap:8, alignItems:"flex-end" }}>
                                  {role === "doctor" && (
                                    <>
                                      <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={e => { e.stopPropagation(); navigate("/modify", { state:{ log }}); }}>
                                        <i className="bi bi-pencil" /> Edit
                                      </button>
                                      <button className="ehr-btn ehr-btn-danger ehr-btn-sm" onClick={e => { e.stopPropagation(); navigate("/delete", { state:{ log }}); }}>
                                        <i className="bi bi-trash" /> Delete
                                      </button>
                                      <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={e => { e.stopPropagation(); navigate(`/patient/${log.patient_id}`); }}>
                                        <i className="bi bi-person-lines-fill" /> Patient Profile
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16 }}>
                  <div style={{ fontSize:13, color:"var(--text-muted)" }}>
                    Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>
                      <i className="bi bi-chevron-left" /> Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_,i) => {
                      const p = page <= 3 ? i+1 : page + i - 2;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button key={p} className={`ehr-btn ehr-btn-sm ${p===page?"ehr-btn-primary":"ehr-btn-ghost"}`} onClick={() => setPage(p)}>{p}</button>
                      );
                    })}
                    <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>
                      Next <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <AuditChatbot />
    </div>
  );
}
