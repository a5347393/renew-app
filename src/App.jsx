import { useState, useRef } from "react";

const ITEMS = {
  prereq: {
    label: "前置評估", color: "#185FA5", bg: "#EBF4FF",
    items: [
      { id: "eval_basic", name: "初步結構安全評估", cap: 1.5, unit: "萬/棟", note: "技師現場勘查・初步報告書" },
      { id: "eval_detail", name: "詳細結構安全評估", cap: 40, unit: "萬/棟", note: "完整結構鑑定・地震風險評估" },
    ]
  },
  outdoor: {
    label: "室外修繕", color: "#0A6647", bg: "#E8F7F1",
    items: [
      { id: "facade", name: "建築物立面修繕", cap: null, unit: "萬/棟", floorBased: true, note: "外牆・窗框・欄杆・壁癌・裂縫" },
      { id: "roof", name: "屋頂防水及隔熱", cap: 20, unit: "萬/棟", note: "防水層・排水坡度・隔熱磚（不含太陽能板）" },
      { id: "ac", name: "外掛空調及管線安全改善", cap: 5, unit: "萬/棟", note: "室外機懸架・冷媒管・外牆電線穿管" },
      { id: "barrier_out", name: "室外無障礙設施", cap: 5, unit: "萬/棟", note: "入口坡道・扶手・防滑地坪・導盲磚" },
    ]
  },
  indoor: {
    label: "室內修繕", color: "#5B2FA0", bg: "#F2EEFF",
    items: [
      { id: "safety", name: "居家安全及無障礙設施", cap: 20, unit: "萬/戶", bonus: 30, note: "扶手・高低差・門扇・地面防滑・防墜" },
      { id: "pipes", name: "管線修繕更新", cap: null, unit: "", note: "給排水・電氣・燃氣管線" },
      { id: "interior", name: "配合修繕之室內裝修", cap: null, unit: "", note: "配合管線或無障礙施作之牆面・地坪修補" },
    ]
  }
};

const FLOORS = [
  { label: "1–2層", cap: 100 },
  { label: "3–4層", cap: 200 },
  { label: "5–6層", cap: 300 },
];

const SUBITEMS = {
  eval_basic: ["技師現場勘查費用", "初步結構安全報告書"],
  eval_detail: ["詳細結構安全鑑定", "地震風險評估報告", "詳細評估報告書"],
  facade: ["外牆磁磚剝落修補更換", "外牆防水漆重新塗佈", "外牆清洗填縫防水處理", "鋁窗框老化更新", "陽台欄杆護欄整修", "外牆壁癌打除重新粉刷", "外牆裂縫灌注補強"],
  roof: ["屋頂防水層重做", "排水坡度修正（避免積水）", "女兒牆壓頂防水修繕", "天溝落水頭整修", "架高通風式隔熱磚鋪設", "反射型隔熱塗料施作"],
  ac: ["室外機懸掛架更換加固防鏽", "膨脹螺栓補強", "空調排水管重新配置", "冷媒管外管包覆整理", "外牆裸露電線穿PVC硬管"],
  barrier_out: ["大門入口坡道新設或改善", "入口扶手加裝（單側或雙側）", "入口門廊防滑地坪處理", "戶外步行路徑導盲磚鋪設"],
  safety: ["樓梯扶手補強・浴室安全扶手", "廁所馬桶側扶手・床邊扶手", "門檻削平或斜坡化", "浴室乾濕分離高低差改善", "門框拓寬至80cm以上", "浴廁防滑磚更換・防滑條貼附", "窗戶限開鎖加裝防墜"],
  pipes: ["老舊鍍鋅鐵管換PVC或不鏽鋼給水管", "各樓層分管更新", "廚房浴廁排水管疏通及更換", "污水立管更換", "老舊電線換新（2.0mm²以上）", "電箱擴充更新・漏電斷路器安裝", "老舊瓦斯鐵管換不鏽鋼管"],
  interior: ["配合管線更新之牆面粉刷修補", "配合無障礙設施之地坪磁磚更換", "配合門扇改善之隔間牆局部修繕"],
};

const NOTE_PLACEHOLDERS = {
  eval_basic: "例：預計請 XX 技師事務所評估，時間約安排在 4 月初",
  eval_detail: "例：需含耐震評估報告，配合申請補助使用",
  facade: "例：2、3 樓北側外牆磁磚脫落嚴重需優先處理，舊磚花樣盡量保留",
  roof: "例：屋頂有積水問題，排水坡度需重新整坡，隔熱磚保留現有架高形式",
  ac: "例：3 台室外機懸架生鏽，2 樓冷媒管外露段約 6 公尺需包覆",
  barrier_out: "例：大門寬度 80cm 需確認是否足夠輪椅進出，坡道長度受限不超過 2 公尺",
  safety: "例：浴室需加裝 L 型扶手，廚房門檻高差 3cm 需處理，主臥窗戶加裝限開鎖",
  pipes: "例：全棟給水管為舊式鍍鋅鐵管，水垢嚴重，電箱容量不足需升級至 50A",
  interior: "例：浴室翻修磁磚配合管線更換一併處理，牆面採白色霧面磚",
};

const SECTION_RULES = { prereq: "2選1", outdoor: "至少選1項", indoor: "完成室外後可選" };
const GROUP_ORDER = ["prereq", "outdoor", "indoor"];

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

export default function App() {
  const [info, setInfo] = useState({ owner: "", address: "", date: new Date().toISOString().slice(0, 10), designer: "", note: "" });
  const [checked, setChecked] = useState({});
  const [subChecked, setSubChecked] = useState({});
  const [floor, setFloor] = useState(0);
  const [bonus, setBonus] = useState(false);
  const [itemNotes, setItemNotes] = useState({});
  const [expanded, setExpanded] = useState({});
  const [exporting, setExporting] = useState(false);
  const printRef = useRef();

  const toggleItem = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id, sub) => setSubChecked(p => ({ ...p, [`${id}::${sub}`]: !p[`${id}::${sub}`] }));
  const toggleExpand = (id, e) => { e.stopPropagation(); setExpanded(p => ({ ...p, [id]: !p[id] })); };
  const getCap = (item) => item.floorBased ? FLOORS[floor].cap : item.cap;

  const selectAllSubs = (id, e) => { e.stopPropagation(); setSubChecked(p => { const n = { ...p }; (SUBITEMS[id] || []).forEach(s => n[`${id}::${s}`] = true); return n; }); };
  const clearAllSubs = (id, e) => { e.stopPropagation(); setSubChecked(p => { const n = { ...p }; (SUBITEMS[id] || []).forEach(s => delete n[`${id}::${s}`]); return n; }); };
  const allSubsChecked = (id) => (SUBITEMS[id] || []).every(s => subChecked[`${id}::${s}`]);
  const anySubChecked = (id) => (SUBITEMS[id] || []).some(s => subChecked[`${id}::${s}`]);

  const totalCap = Object.values(ITEMS).flatMap(g => g.items).reduce((acc, item) => {
    if (!checked[item.id]) return acc;
    const cap = getCap(item); if (!cap) return acc;
    return acc + ((item.id === "safety" && bonus) ? item.bonus : cap);
  }, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allItems = Object.values(ITEMS).flatMap(g => g.items);
  const pct = allItems.length ? Math.round((checkedCount / allItems.length) * 100) : 0;
  const hasOutdoor = ITEMS.outdoor.items.some(i => checked[i.id]);

  const handleExport = async () => {
    if (checkedCount === 0) { alert("請先勾選至少一個項目"); return; }
    setExporting(true);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      const canvas = await window.html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff", logging: false });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pW = pdf.internal.pageSize.getWidth(), pH = pdf.internal.pageSize.getHeight();
      const img = canvas.toDataURL("image/png");
      const iH = (canvas.height * pW) / canvas.width;
      let rem = iH, pos = 0;
      pdf.addImage(img, "PNG", 0, pos, pW, iH); rem -= pH;
      while (rem > 0) { pos -= pH; pdf.addPage(); pdf.addImage(img, "PNG", 0, pos, pW, iH); rem -= pH; }
      pdf.save("修繕補助勾選單.pdf");
    } catch { alert("匯出失敗，請重試"); }
    finally { setExporting(false); }
  };

  const PrintContent = () => (
    <div style={{ fontFamily: "sans-serif", padding: "24px 28px", background: "#fff", color: "#111", width: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "3px solid #0A6647", paddingBottom: 14, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 4, color: "#0A6647", marginBottom: 4 }}>內政部國土管理署</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0A6647" }}>老宅延壽機能復新計畫</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>透天住宅修繕補助勾選單</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#888" }}>
          <div>日期：{info.date}</div>
          <div>設計師：{info.designer || "—"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", background: "#f8f8f6", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 12 }}>
        <div><span style={{ color: "#888" }}>業主　</span><strong>{info.owner || "—"}</strong></div>
        <div><span style={{ color: "#888" }}>地址　</span><strong>{info.address || "—"}</strong></div>
      </div>
      <div style={{ background: "#EBF4FF", color: "#185FA5", borderRadius: 6, padding: "7px 14px", fontSize: 11, marginBottom: 18 }}>
        申請規則：各項最多補助實際費用 65%，不超過額度上限。室內修繕需先完成至少 1 項室外修繕。
      </div>
      {Object.entries(ITEMS).map(([, group]) => {
        const vis = group.items.filter(i => checked[i.id]);
        if (!vis.length) return null;
        return (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div style={{ background: group.bg, color: group.color, padding: "6px 14px", borderRadius: 5, fontWeight: 700, fontSize: 12, marginBottom: 10 }}>{group.label}</div>
            {vis.map(item => {
              const cap = getCap(item);
              const capStr = cap ? `上限 ${(item.id === "safety" && bonus) ? item.bonus : cap} ${item.unit}` : "含於室內補助範圍";
              const cSubs = (SUBITEMS[item.id] || []).filter(s => subChecked[`${item.id}::${s}`]);
              return (
                <div key={item.id} style={{ border: `1.5px solid ${group.color}22`, borderLeft: `4px solid ${group.color}`, borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, marginBottom: 3 }}>
                    <strong style={{ color: group.color, fontSize: 13 }}>{item.name}</strong>
                    <span style={{ color: "#C04A10", fontWeight: 700, fontSize: 12 }}>{capStr}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>{item.note}</div>
                  {cSubs.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {cSubs.map(s => <span key={s} style={{ fontSize: 10, padding: "2px 8px", background: group.bg, color: group.color, borderRadius: 12, border: `1px solid ${group.color}44` }}>✓ {s}</span>)}
                    </div>
                  )}
                  {itemNotes[item.id] && <div style={{ fontSize: 11, color: "#555", marginTop: 8, padding: "5px 10px", background: "#f5f5f2", borderRadius: 4, borderLeft: "3px solid #ccc", fontStyle: "italic" }}>備註：{itemNotes[item.id]}</div>}
                </div>
              );
            })}
          </div>
        );
      })}
      {checkedCount > 0 && (
        <div style={{ background: "#E8F7F1", border: "1.5px solid #0A664744", borderRadius: 8, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#0A6647", fontSize: 13 }}>勾選項目補助上限合計（棟）</div>
            <div style={{ fontSize: 11, color: "#2AA37A", marginTop: 2 }}>實際補助 = 各項工程費 × 65%</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0A6647" }}>{totalCap} <span style={{ fontSize: 13 }}>萬元</span></div>
        </div>
      )}
      {info.note && <div style={{ background: "#f8f8f6", borderRadius: 6, padding: "10px 14px", marginTop: 14, fontSize: 11, color: "#444" }}><strong>整體備註：</strong>{info.note}</div>}
    </div>
  );

  const inSt = { width: "100%", border: "1.5px solid #e8e8e4", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", color: "#111" };

  return (
    <div style={{ fontFamily: "-apple-system, system-ui, sans-serif", maxWidth: 680, margin: "0 auto", paddingBottom: 140, color: "#111" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, textarea:focus { border-color: #0A6647 !important; box-shadow: 0 0 0 3px #0A664718 !important; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#0A6647", padding: "16px 20px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: "#6FD4AA", marginBottom: 6 }}>內政部國土管理署</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>老宅延壽機能復新計畫</div>
            <div style={{ fontSize: 12, color: "#A8E6CC", marginTop: 3 }}>透天住宅修繕補助勾選單</div>
          </div>
          <button onClick={handleExport} disabled={exporting}
            style={{ background: exporting ? "#555" : "#fff", color: exporting ? "#aaa" : "#0A6647", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: exporting ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {exporting
              ? <span style={{ width: 14, height: 14, border: "2px solid #aaa", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
              : "⬇"}
            {exporting ? "產生中..." : "匯出 PDF"}
          </button>
        </div>

      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Info card */}
        <div style={{ background: "#fff", border: "1.5px solid #e8e8e4", borderRadius: 12, padding: "16px", margin: "16px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 2, marginBottom: 12 }}>基本資料</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>
            {[["owner","業主姓名","請輸入姓名"],["address","房屋地址","縣市區路段"],["designer","設計師","設計師姓名"],["date","日期",""]].map(([k,l,ph]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500 }}>{l}</div>
                <input value={info[k]} onChange={e => setInfo(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={inSt} />
              </div>
            ))}
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500 }}>整體備註</div>
              <textarea value={info.note} onChange={e => setInfo(p=>({...p,note:e.target.value}))} rows={2}
                placeholder="例：全棟屋齡 35 年，自住，預計明年動工，預算約 200 萬"
                style={{ ...inSt, resize: "vertical", lineHeight: 1.6 }} />
            </div>
          </div>
        </div>

        {/* Rule */}
        <div style={{ background: "#EBF4FF", border: "1px solid #B8D4F5", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#185FA5", lineHeight: 1.8, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ</span>
          <div><strong>申請規則：</strong>室外修繕至少選 1 項，才可申請室內修繕。各項補助 = 工程費 × <strong>65%</strong>，不超過額度上限。</div>
        </div>

        {/* Groups */}
        {GROUP_ORDER.map(gKey => {
          const group = ITEMS[gKey];
          const groupChecked = group.items.filter(i => checked[i.id]).length;
          const isLocked = gKey === "indoor" && !hasOutdoor;

          return (
            <div key={gKey} style={{ marginBottom: 28, opacity: isLocked ? 0.5 : 1, transition: "opacity .2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: `${group.color}33` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: group.color }}>{group.label}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: group.bg, color: group.color, border: `1px solid ${group.color}44`, fontWeight: 500 }}>{SECTION_RULES[gKey]}</span>
                  {groupChecked > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: group.color, color: "#fff", fontWeight: 700 }}>{groupChecked} 選</span>}
                </div>
                <div style={{ flex: 1, height: 1, background: `${group.color}33` }} />
              </div>

              {isLocked && (
                <div style={{ fontSize: 12, color: "#888", textAlign: "center", marginBottom: 12, padding: "8px 14px", background: "#f5f5f3", borderRadius: 8, border: "1px solid #e8e8e4" }}>
                  需先完成至少 1 項室外修繕才可選擇
                </div>
              )}

              {group.items.map(item => {
                const cap = getCap(item), isOn = !!checked[item.id], isExp = !!expanded[item.id];
                const subs = SUBITEMS[item.id] || [];
                const subCount = subs.filter(s => subChecked[`${item.id}::${s}`]).length;
                const capDisplay = cap ? `${(item.id === "safety" && bonus) ? item.bonus : cap} ${item.unit}` : "";

                return (
                  <div key={item.id} style={{ borderRadius: 12, marginBottom: 8, overflow: "hidden", border: `1.5px solid ${isOn ? group.color : "#E8E8E4"}`, boxShadow: isOn ? `0 2px 12px ${group.color}18` : "none", transition: "all .15s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 14px", cursor: isLocked ? "default" : "pointer", background: isOn ? group.bg : "#fff" }}
                      onClick={() => !isLocked && toggleItem(item.id)}>

                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isOn ? group.color : "#CCC"}`, background: isOn ? group.color : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .15s" }}>
                        {isOn && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "4px 8px" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: isOn ? group.color : "#222" }}>{item.name}</span>
                          {capDisplay && <span style={{ fontSize: 12, fontWeight: 700, color: "#C04A10", background: "#FEF2EB", padding: "1px 8px", borderRadius: 20, flexShrink: 0 }}>上限 {capDisplay}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.5 }}>{item.note}</div>

                        {item.id === "safety" && (
                          <label onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11, color: "#5B2FA0", cursor: "pointer", background: "#F2EEFF", padding: "5px 10px", borderRadius: 20, border: "1px solid #B89FE0" }}>
                            <input type="checkbox" checked={bonus} onChange={() => setBonus(p=>!p)} onClick={e=>e.stopPropagation()} style={{ accentColor: "#5B2FA0" }} />
                            符合加碼條件 → 上限提升為 30萬/戶
                          </label>
                        )}

                        {item.floorBased && isOn && (
                          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: 11, color: "#888", alignSelf: "center" }}>樓層：</span>
                            {FLOORS.map((f, i) => (
                              <button key={i} onClick={() => setFloor(i)}
                                style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${floor===i ? group.color : "#ddd"}`, background: floor===i ? group.color : "#fff", color: floor===i ? "#fff" : "#666", cursor: "pointer", fontFamily: "inherit", fontWeight: floor===i ? 700 : 400, transition: "all .12s" }}>
                                {f.label}（{f.cap}萬）
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {subs.length > 0 && (
                        <button onClick={e => toggleExpand(item.id, e)}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: isExp ? group.bg : "#f5f5f3", border: `1px solid ${isExp ? group.color+"44" : "#e8e8e4"}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: isExp ? group.color : "#888" }}>{isExp ? "▲" : "▼"}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: subCount > 0 ? group.color : "#bbb" }}>{subCount}/{subs.length}</span>
                        </button>
                      )}
                    </div>

                    {isExp && (
                      <div style={{ borderTop: `1.5px solid ${group.bg}`, padding: "14px 14px 16px 48px", background: "#FAFAF8" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>施作細項 <span style={{ color: subCount > 0 ? group.color : "#bbb", fontWeight: 700 }}>{subCount}/{subs.length}</span> 已選</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={e => selectAllSubs(item.id, e)}
                              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${group.color}`, background: allSubsChecked(item.id) ? group.color : "transparent", color: allSubsChecked(item.id) ? "#fff" : group.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>全選</button>
                            <button onClick={e => clearAllSubs(item.id, e)}
                              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: "1.5px solid #ddd", background: anySubChecked(item.id) ? "#f0f0ee" : "transparent", color: "#666", cursor: "pointer", fontFamily: "inherit" }}>全取消</button>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 8px", marginBottom: 14 }}>
                          {subs.map(sub => {
                            const isSubOn = !!subChecked[`${item.id}::${sub}`];
                            return (
                              <label key={sub} onClick={e => e.stopPropagation()}
                                style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 12, padding: "7px 10px", borderRadius: 8, background: isSubOn ? group.bg : "#fff", color: isSubOn ? group.color : "#444", border: `1.5px solid ${isSubOn ? group.color+"88" : "#E8E8E4"}`, transition: "all .12s", lineHeight: 1.4 }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSubOn ? group.color : "#CCC"}`, background: isSubOn ? group.color : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                  {isSubOn && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <input type="checkbox" checked={isSubOn} onChange={() => toggleSub(item.id, sub)} style={{ display: "none" }} />
                                {sub}
                              </label>
                            );
                          })}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 500 }}>備註給設計師</div>
                          <textarea value={itemNotes[item.id] || ""} onChange={e => setItemNotes(p=>({...p,[item.id]:e.target.value}))}
                            rows={2} placeholder={NOTE_PLACEHOLDERS[item.id] || "輸入備註..."}
                            style={{ width: "100%", border: "1.5px solid #e8e8e4", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontFamily: "inherit", background: "#fff", resize: "vertical", outline: "none", lineHeight: 1.6, color: "#111" }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sticky bottom */}
      <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1.5px solid #E8E8E4" }}>
        <div style={{ margin: "10px 16px 12px", background: "#0A6647", borderRadius: 12, padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>已勾選 {checkedCount} 個項目{totalCap > 0 ? " · 補助上限合計" : ""}</div>
            <div style={{ fontSize: 11, color: "#A8E6CC", marginTop: 2 }}>每項實際補助 = 工程費 × 65%</div>
          </div>
          {totalCap > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{totalCap}</div>
              <div style={{ fontSize: 11, color: "#A8E6CC" }}>萬元上限</div>
            </div>
          )}
        </div>
      </div>

      <div ref={printRef} style={{ position: "absolute", left: -9999, top: 0, zIndex: -1 }}>
        <PrintContent />
      </div>
    </div>
  );
}
