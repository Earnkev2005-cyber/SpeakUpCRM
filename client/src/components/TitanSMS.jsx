import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import * as api from "../api";

// ─── CONSTANTS ───────────────────────────────────────────────────
const BRAND = {
  navy: "#1a2a40",
  navyMid: "#425566",
  navyLight: "#71808c",
  navyMuted: "#a1aab3",
  red: "#ff4d4d",
  redHover: "#ff6161",
  redLight: "#ffd7d8",
  redTint: "#fff0f0",
  white: "#ffffff",
  black: "#000000",
  green: "#2D7A3A",
  greenLight: "#E8F5E9",
  orange: "#D4781A",
  orangeLight: "#FFF3E0",
  errorRed: "#C62828",
  errorRedLight: "#FFEBEE",
  surface: "#f8f9fb",
  border: "#d0d5d9",
  grey: "#71808c",
  greyLight: "#f5f6f7",
  blue: "#425566",
  blueLight: "#e8ecf1",
};

const CRM_STAGES = ["Prospect", "Lead", "Customer", "Raving Fan"];
const STRIKE_MAX = 3;
const SUBJECTS = ["Computer Science", "ICT", "Mathematics", "Physics", "Biology", "Chemistry"];
const ADS_PLATFORMS = ["Facebook Ads", "Instagram Ads", "TikTok Ads", "Google Ads", "YouTube Ads", "Other"];
const TABS = ["Dashboard", "Students", "Batches", "Invoices", "Payment History", "CRM", "Teachers", "Marketing", "Settings"];

const ICONS = {
  Dashboard: "📊", Students: "🎓", Batches: "📚", Invoices: "🧾", "Payment History": "💳", CRM: "🤝", Teachers: "🧑‍🏫", Marketing: "📢", Settings: "⚙️",
  search: "🔍", add: "➕", edit: "✏️", trash: "🗑️", check: "✅", x: "❌",
  warning: "⚠️", clock: "🕐", money: "💰", star: "⭐", fire: "🔥",
  send: "📤", eye: "👁️", download: "⬇️", filter: "🔽",
};

// ─── HELPERS ─────────────────────────────────────────────────────
const fmtMMK = (n) => new Intl.NumberFormat("en-US").format(n) + " MMK";
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
const today = () => localStorage.getItem("__testDate") || new Date().toISOString().split("T")[0];
const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const currentMonthKey = () => { const d = localStorage.getItem("__testDate"); return monthKey(d ? new Date(d + "T12:00:00") : new Date()); };
const isExamPast = (examDate) => !!examDate && currentMonthKey() > examDate.slice(0, 7);
const addOneMonth = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const nm = month === 12 ? 1 : month + 1;
  const ny = month === 12 ? year + 1 : year;
  const lastDay = new Date(ny, nm, 0).getDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
};
const fmtPeriod = (start, end) => {
  if (!start || !end) return "—";
  const fmt = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const endYear = new Date(end + "T12:00:00").getFullYear();
  return `${fmt(start)} – ${fmt(end)} ${endYear}`;
};
const isExamSoon = (examDate) => {
  if (!examDate) return false;
  const examMk = examDate.slice(0, 7);
  const nowMk = currentMonthKey();
  if (examMk < nowMk) return false;
  const diff = (new Date(examMk + "-01") - new Date(nowMk + "-01")) / (1000 * 60 * 60 * 24 * 30);
  return diff <= 2;
};

// ─── STYLES ──────────────────────────────────────────────────────
const S = {
  app: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: BRAND.surface, color: BRAND.navy },
  sidebar: { width: 240, background: BRAND.navy, color: BRAND.white, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 },
  sidebarHeader: { padding: "24px 20px 16px", borderBottom: `1px solid ${BRAND.navyMid}` },
  sidebarLogo: { fontSize: 22, fontWeight: 800, color: BRAND.white, letterSpacing: "-0.5px", lineHeight: 1.1, fontFamily: "'Montserrat', sans-serif" },
  sidebarLogoAccent: { color: BRAND.red },
  sidebarSub: { fontSize: 11, color: BRAND.navyMuted, marginTop: 5, letterSpacing: "1px", textTransform: "uppercase" },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer",
    background: active ? BRAND.navyMid : "transparent",
    color: active ? BRAND.white : BRAND.navyMuted,
    fontSize: 14, fontWeight: active ? 600 : 400, transition: "all 0.2s",
    borderLeft: active ? `3px solid ${BRAND.red}` : "3px solid transparent",
  }),
  main: { flex: 1, padding: "28px 36px", maxWidth: 1200, overflow: "auto" },
  pageTitle: { fontSize: 28, fontWeight: 700, color: BRAND.navy, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" },
  pageDesc: { fontSize: 14, color: BRAND.grey, marginBottom: 24 },
  card: { background: BRAND.white, borderRadius: 10, border: `1px solid ${BRAND.border}`, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: BRAND.navy, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Montserrat', sans-serif" },
  statsRow: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  statCard: (accent) => ({
    flex: "1 1 180px", background: BRAND.white, borderRadius: 10, padding: "20px 24px",
    border: `1px solid ${BRAND.border}`, borderLeft: `4px solid ${accent}`, minWidth: 180,
  }),
  statCardFeatured: (bg) => ({
    flex: "1 1 210px", background: bg, borderRadius: 10, padding: "22px 28px",
    minWidth: 210, boxShadow: "0 4px 16px rgba(26,42,64,0.18)",
  }),
  statNum: { fontSize: 28, fontWeight: 700, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif" },
  statNumFeatured: { fontSize: 30, fontWeight: 800, color: BRAND.white, fontFamily: "'Montserrat', sans-serif", letterSpacing: "-0.5px" },
  statLabel: { fontSize: 12, color: BRAND.grey, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" },
  statLabelFeatured: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.5px" },
  dashCard: (accent) => ({
    flex: "1 1 220px", minWidth: 220, background: BRAND.white, borderRadius: 10,
    padding: "20px 22px", borderTop: `3px solid ${accent}`,
    boxShadow: "0 1px 6px rgba(26,42,64,0.06)",
  }),
  dashRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BRAND.border}`, fontSize: 13 },
  dashRowLast: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: `2px solid ${BRAND.border}`, color: BRAND.grey, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "10px 12px", borderBottom: `1px solid ${BRAND.border}`, verticalAlign: "middle" },
  btn: (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s",
    ...(variant === "primary" ? { background: BRAND.red, color: BRAND.white } : {}),
    ...(variant === "secondary" ? { background: BRAND.white, color: BRAND.navy, border: `1px solid ${BRAND.border}` } : {}),
    ...(variant === "gold" ? { background: BRAND.navy, color: BRAND.white } : {}),
    ...(variant === "danger" ? { background: BRAND.errorRed, color: BRAND.white } : {}),
    ...(variant === "success" ? { background: BRAND.green, color: BRAND.white } : {}),
    ...(variant === "ghost" ? { background: "transparent", color: BRAND.red, padding: "8px 12px" } : {}),
    ...(variant === "small" ? { background: BRAND.greyLight, color: BRAND.navy, padding: "4px 10px", fontSize: 12, border: `1px solid ${BRAND.border}` } : {}),
  }),
  badge: (color, bg) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg,
  }),
  input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BRAND.border}`, fontSize: 14, fontFamily: "'Inter', sans-serif", background: BRAND.white, boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${BRAND.border}`, fontSize: 14, fontFamily: "'Inter', sans-serif", background: BRAND.white, boxSizing: "border-box" },
  formGroup: { marginBottom: 16 },
  formLabel: { display: "block", fontSize: 12, fontWeight: 600, color: BRAND.grey, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,42,64,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: BRAND.white, borderRadius: 12, padding: 28, maxWidth: 520, width: "90%", maxHeight: "85vh", overflow: "auto" },
  modalTitle: { fontSize: 20, fontWeight: 700, color: BRAND.navy, marginBottom: 20, fontFamily: "'Montserrat', sans-serif" },
  toolbar: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  searchBox: { flex: "1 1 220px", position: "relative" },
  searchInput: { width: "100%", padding: "8px 12px 8px 36px", borderRadius: 6, border: `1px solid ${BRAND.border}`, fontSize: 14, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" },
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14 },
  pipelineRow: { display: "flex", gap: 16, marginBottom: 24, overflowX: "auto" },
  pipelineCol: (accent) => ({
    flex: "1 1 220px", minWidth: 220, background: BRAND.white, borderRadius: 10,
    border: `1px solid ${BRAND.border}`, borderTop: `3px solid ${accent}`, overflow: "hidden",
  }),
  pipelineHeader: { padding: "12px 16px", fontWeight: 700, fontSize: 13, borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
  pipelineCard: { padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, cursor: "pointer", transition: "background 0.15s" },
  invoicePreview: { border: `2px solid ${BRAND.navy}`, borderRadius: 10, padding: 32, background: BRAND.white, maxWidth: 600, margin: "0 auto" },
  flex: { display: "flex", alignItems: "center", gap: 8 },
  flexBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tag: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: BRAND.blueLight, color: BRAND.navy, marginRight: 4 },
  emptyState: { textAlign: "center", padding: "48px 20px", color: BRAND.grey },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...S.flexBetween, marginBottom: 8 }}>
          <div style={S.modalTitle}>{title}</div>
          <button style={S.btn("ghost")} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ stage }) {
  const map = {
    Prospect: [BRAND.blue, BRAND.blueLight],
    Lead: [BRAND.orange, BRAND.orangeLight],
    Customer: [BRAND.green, BRAND.greenLight],
    "Raving Fan": [BRAND.red, BRAND.redTint],
    Paid: [BRAND.green, BRAND.greenLight],
    Unpaid: [BRAND.errorRed, BRAND.errorRedLight],
    Overdue: [BRAND.orange, BRAND.orangeLight],
    Active: [BRAND.green, BRAND.greenLight],
    Inactive: [BRAND.grey, BRAND.greyLight],
    Expelled: [BRAND.errorRed, BRAND.errorRedLight],
  };
  const [c, bg] = map[stage] || [BRAND.grey, BRAND.greyLight];
  return <span style={S.badge(c, bg)}>{stage}</span>;
}

function Strikes({ count }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }} title={`${count}/${STRIKE_MAX} strikes`}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < count ? BRAND.errorRed : BRAND.border, display: "inline-block" }} />
      ))}
    </span>
  );
}

function EmptyState({ icon, message, action }) {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIcon}>{icon}</div>
      <div style={{ marginBottom: 16 }}>{message}</div>
      {action}
    </div>
  );
}

// ─── SALARY HELPERS ──────────────────────────────────────────────
function nth(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function getSalaryStatus(teacher, teacherSalaries) {
  const mk = currentMonthKey();
  const todayDay = parseInt(today().split("-")[2]);
  const record = (teacherSalaries || []).find((s) => s.teacherId === teacher.id && s.monthKey === mk);
  if (record) return { status: record.status === "Paid" ? "paid" : "unpaid", record };
  const payDay = teacher.salaryPayDay || 1;
  return { status: todayDay >= payDay ? "overdue" : "upcoming", record: null };
}

const SALARY_STATUS_STYLE = {
  paid:     { label: "Paid",     color: BRAND.green,    bg: BRAND.greenLight },
  unpaid:   { label: "Due",      color: BRAND.orange,   bg: BRAND.orangeLight },
  overdue:  { label: "Overdue",  color: BRAND.errorRed, bg: BRAND.errorRedLight },
  upcoming: { label: "Upcoming", color: BRAND.grey,     bg: BRAND.greyLight },
};

// ─── DASHBOARD ───────────────────────────────────────────────────
function Dashboard({ data }) {
  const { students, invoices, leads, batches, teachers = [], teacherSalaries = [], expenses = [], paymentHistory = [] } = data;
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const mrr = students
    .filter((s) => s.status === "Active")
    .reduce((sum, s) => {
      const batch = batches.find((b) => b.id === s.batchId);
      return sum + (s.customFee != null ? s.customFee : (batch ? batch.fee : 0));
    }, 0);
  const unpaidInvoices = invoices.filter((i) => i.status === "Unpaid" || i.status === "Overdue").length;
  const totalLeads = leads.filter((l) => l.stage === "Lead" || l.stage === "Prospect").length;

  // Month date range — used for all "this month" filters
  const thisMonth = currentMonthKey();
  const monthStart = `${thisMonth}-01`;
  const lastDayNum = new Date(new Date(monthStart + "T12:00:00").getFullYear(), new Date(monthStart + "T12:00:00").getMonth() + 1, 0).getDate();
  const monthEnd = `${thisMonth}-${String(lastDayNum).padStart(2, "0")}`;

  // Revenue from student payment history
  const totalRevenue = paymentHistory.reduce((sum, ph) => sum + ph.amount, 0);
  const monthRevenue = paymentHistory
    .filter((ph) => ph.paidDate >= monthStart && ph.paidDate <= monthEnd)
    .reduce((sum, ph) => sum + ph.amount, 0);
  const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
  const recentLeads = leads
    .filter((l) => l.stage === "Lead")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const strikStudents = students.filter((s) => s.strikes >= 2 && s.status === "Active");

  // Salary & profit — split by department
  const teachingStaff = teachers.filter((t) => t.department !== "Marketing");
  const marketingStaff = teachers.filter((t) => t.department === "Marketing");
  const activeTeachers = teachingStaff.filter((t) => t.status === "Active");
  const activeMarketing = marketingStaff.filter((t) => t.status === "Active");
  const teachingSalaryBudget = activeTeachers.reduce((s, t) => s + (t.monthlySalary || 0), 0);
  const marketingBudget = activeMarketing.reduce((s, t) => s + (t.monthlySalary || 0), 0);
  const totalMonthlySalary = teachingSalaryBudget + marketingBudget;
  // Teacher salaries actually paid this month (by paidDate, not by which month they cover)
  const paidSalaryThisMonth = teacherSalaries
    .filter((s) => s.status === "Paid" && s.paidDate >= monthStart && s.paidDate <= monthEnd)
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const thisMonthAdsSpend = expenses
    .filter((e) => e.category === "Marketing" && e.monthKey === thisMonth)
    .reduce((sum, e) => sum + e.amount, 0);
  const profit = monthRevenue - paidSalaryThisMonth - thisMonthAdsSpend;
  const monthlyRecurringProfit = mrr - totalMonthlySalary;
  const overdueTeachers = activeTeachers.filter((t) => {
    const { status } = getSalaryStatus(t, teacherSalaries);
    return status === "overdue" || status === "unpaid";
  });
  const overdueMarketing = activeMarketing.filter((t) => {
    const { status } = getSalaryStatus(t, teacherSalaries);
    return status === "overdue" || status === "unpaid";
  });

  const secDiv = (label) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 4 }}>
      <div style={{ width: 3, height: 14, background: BRAND.red, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: BRAND.navyMid, textTransform: "uppercase", letterSpacing: "1.5px" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: BRAND.border }} />
    </div>
  );

  const attentionCount = overdueInvoices.length + strikStudents.length + overdueTeachers.length + overdueMarketing.length;

  const fmtShort = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const monthRange = `${fmtShort(monthStart)} – ${fmtShort(monthEnd)}`;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ ...S.flexBetween, marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={S.pageTitle}>Dashboard</div>
          <div style={S.pageDesc}>SpeakUp English — Overview</div>
        </div>
        {attentionCount > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: BRAND.redTint, border: `1px solid ${BRAND.redLight}`, borderRadius: 20, fontSize: 12, fontWeight: 700, color: BRAND.red }}>
            ⚠ {attentionCount} item{attentionCount !== 1 ? "s" : ""} need{attentionCount === 1 ? "s" : ""} attention
          </div>
        )}
      </div>

      {/* ── Hero panel — single navy card, two columns ── */}
      <div style={{
        background: BRAND.navy, borderRadius: 14, padding: "28px 36px",
        display: "flex", gap: 40, marginBottom: 20,
        boxShadow: "0 4px 24px rgba(26,42,64,0.18)", flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 220px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>
            Monthly Recurring Revenue
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: BRAND.white, fontFamily: "'Montserrat', sans-serif", letterSpacing: "-1.5px", lineHeight: 1 }}>
            {fmtMMK(mrr)}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 10 }}>
            {activeStudents} student{activeStudents !== 1 ? "s" : ""}
            {activeStudents > 0 ? ` · avg ${fmtMMK(Math.round(mrr / activeStudents))}/student` : ""}
          </div>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>
            Monthly Recurring Profit{monthlyRecurringProfit < 0 ? " · Loss" : ""}
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, fontFamily: "'Montserrat', sans-serif", letterSpacing: "-1.5px", lineHeight: 1, color: monthlyRecurringProfit >= 0 ? BRAND.white : BRAND.red }}>
            {monthlyRecurringProfit < 0 ? "−" : ""}{fmtMMK(Math.abs(monthlyRecurringProfit))}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 10 }}>
            {fmtMMK(mrr)} revenue − {fmtMMK(totalMonthlySalary)} costs
          </div>
        </div>
      </div>

      {/* ── Three summary cards ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>

        {/* This Month */}
        <div style={S.dashCard(BRAND.navy)}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif", marginBottom: 14 }}>
            This Month &nbsp;<span style={{ fontWeight: 400, color: BRAND.grey, fontSize: 11 }}>{monthRange}</span>
          </div>
          <div style={S.dashRow}>
            <span style={{ color: BRAND.grey }}>Collected</span>
            <strong style={{ color: BRAND.navy }}>{fmtMMK(monthRevenue)}</strong>
          </div>
          <div style={S.dashRow}>
            <span style={{ color: BRAND.grey }}>Est. Net Profit</span>
            <strong style={{ color: profit >= 0 ? BRAND.green : BRAND.errorRed }}>
              {profit < 0 ? "−" : ""}{fmtMMK(Math.abs(profit))}
            </strong>
          </div>
          <div style={S.dashRowLast}>
            <span style={{ color: BRAND.grey }}>All-Time Revenue</span>
            <strong style={{ color: BRAND.navy }}>{fmtMMK(totalRevenue)}</strong>
          </div>
        </div>

        {/* Monthly Costs */}
        <div style={S.dashCard(BRAND.navyLight)}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif", marginBottom: 14 }}>Monthly Costs</div>
          <div style={S.dashRow}>
            <span style={{ color: BRAND.grey }}>Teaching <span style={{ fontSize: 11 }}>({activeTeachers.length})</span></span>
            <strong>{fmtMMK(teachingSalaryBudget)}</strong>
          </div>
          <div style={S.dashRow}>
            <span style={{ color: BRAND.grey }}>Marketing <span style={{ fontSize: 11 }}>({activeMarketing.length})</span></span>
            <strong>{fmtMMK(marketingBudget)}</strong>
          </div>
          <div style={{ ...S.dashRowLast, borderTop: `1px solid ${BRAND.border}`, paddingTop: 10, marginTop: 2 }}>
            <span style={{ fontWeight: 600, color: BRAND.navy }}>Total</span>
            <strong style={{ color: BRAND.red }}>{fmtMMK(totalMonthlySalary)}</strong>
          </div>
        </div>

        {/* Operations */}
        <div style={S.dashCard(BRAND.red)}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif", marginBottom: 14 }}>Operations</div>
          <div style={S.dashRow}>
            <span style={{ color: BRAND.grey }}>Active Students</span>
            <strong>{activeStudents}</strong>
          </div>
          <div style={S.dashRow}>
            <span style={{ color: BRAND.grey }}>Unpaid Invoices</span>
            <strong style={{ color: unpaidInvoices > 0 ? BRAND.orange : BRAND.navy }}>{unpaidInvoices}</strong>
          </div>
          <div style={S.dashRowLast}>
            <span style={{ color: BRAND.grey }}>Active Leads</span>
            <strong>{totalLeads}</strong>
          </div>
        </div>
      </div>

      {/* ── School overview ── */}
      {secDiv("School Overview")}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

        <div style={{ ...S.card, flex: "1 1 340px" }}>
          <div style={S.cardTitle}>{ICONS.fire} Batch Capacity</div>
          {batches.length === 0 ? (
            <div style={{ fontSize: 13, color: BRAND.grey }}>No batches yet.</div>
          ) : batches.map((b) => {
            const enrolled = students.filter((s) => s.batchId === b.id && s.status === "Active").length;
            const pct = Math.round((enrolled / b.maxStudents) * 100);
            return (
              <div key={b.id} style={{ marginBottom: 16 }}>
                <div style={{ ...S.flexBetween, marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</span>
                    {b.examSession && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: isExamPast(b.examDate) ? BRAND.grey : BRAND.navy }}>
                        {isExamPast(b.examDate) ? "✓" : "🎯"} {b.examSession}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: pct >= 90 ? BRAND.red : BRAND.grey }}>{enrolled}/{b.maxStudents}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: BRAND.greyLight, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? BRAND.red : pct >= 70 ? BRAND.navyMid : BRAND.green, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...S.card, flex: "1 1 340px" }}>
          <div style={S.cardTitle}>{ICONS.warning} Attention Needed</div>
          {overdueInvoices.length > 0 && (
            <div style={{ padding: "10px 14px", background: BRAND.orangeLight, borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
              <strong>{overdueInvoices.length}</strong> overdue invoice{overdueInvoices.length > 1 ? "s" : ""} — pending collection
            </div>
          )}
          {strikStudents.length > 0 && (
            <div style={{ padding: "10px 14px", background: BRAND.errorRedLight, borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
              <strong>{strikStudents.length}</strong> student{strikStudents.length > 1 ? "s" : ""} at 2+ strikes
            </div>
          )}
          {overdueTeachers.length > 0 && (
            <div style={{ padding: "10px 14px", background: BRAND.redTint, border: `1px solid ${BRAND.redLight}`, borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: BRAND.red }}>{overdueTeachers.length}</strong> teacher salary{overdueTeachers.length > 1 ? " payments" : " payment"} due
              <div style={{ marginTop: 3, fontSize: 12, color: BRAND.grey }}>{overdueTeachers.map((t) => t.name).join(", ")}</div>
            </div>
          )}
          {overdueMarketing.length > 0 && (
            <div style={{ padding: "10px 14px", background: BRAND.redTint, border: `1px solid ${BRAND.redLight}`, borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
              <strong style={{ color: BRAND.red }}>{overdueMarketing.length}</strong> marketing salary{overdueMarketing.length > 1 ? " payments" : " payment"} due
              <div style={{ marginTop: 3, fontSize: 12, color: BRAND.grey }}>{overdueMarketing.map((t) => t.name).join(", ")}</div>
            </div>
          )}
          {attentionCount === 0 && (
            <div style={{ color: BRAND.grey, fontSize: 13 }}>✓ All clear — nothing needs urgent attention.</div>
          )}
          {recentLeads.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.grey, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Leads</div>
              {recentLeads.map((l) => (
                <div key={l.id} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500 }}>{l.name}</span>
                  <span style={{ color: BRAND.grey, fontSize: 12 }}>{l.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STUDENTS ────────────────────────────────────────────────────
function StudentsPage({ students, batches, onSaveStudent, onDeleteStudent, onAddStrike, onRemoveStrike }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = students.filter((s) => {
    if (filterBatch !== "all" && s.batchId !== filterBatch) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function saveStudent(student) {
    const saved = await onSaveStudent(student);
    if (student.id) {
      setShowAdd(false);
      setEditing(null);
    }
    return saved;
  }

  async function deleteStudent(id) {
    if (!confirm("Remove this student?")) return;
    try {
      await onDeleteStudent(id);
    } catch (err) {
      alert(err.message);
    }
  }

  async function addStrike(id) {
    try {
      await onAddStrike(id);
    } catch (err) {
      alert(err.message);
    }
  }

  async function removeStrike(id) {
    try {
      await onRemoveStrike(id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div style={S.pageTitle}>Students</div>
      <div style={S.pageDesc}>Manage enrolled students, track attendance and performance</div>

      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>{ICONS.search}</span>
          <input style={S.searchInput} placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select style={{ ...S.select, width: "auto", minWidth: 160 }} value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
          <option value="all">All Batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select style={{ ...S.select, width: "auto", minWidth: 120 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Expelled">Expelled</option>
        </select>
        <button style={S.btn("primary")} onClick={() => setShowAdd(true)}>{ICONS.add} Add Student</button>
      </div>

      <div style={S.card}>
        {filtered.length === 0 ? (
          <EmptyState icon="🎓" message="No students found" action={<button style={S.btn("primary")} onClick={() => setShowAdd(true)}>Add First Student</button>} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Batch</th>
                  <th style={S.th}>Subject</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Strikes</th>
                  <th style={S.th}>Enrolled</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const batch = batches.find((b) => b.id === s.batchId);
                  return (
                    <tr key={s.id} onMouseEnter={(e) => e.currentTarget.style.background = BRAND.surface} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        {s.nameBurmese && <div style={{ fontSize: 12, color: BRAND.navy }}>{s.nameBurmese}</div>}
                        <div style={{ fontSize: 11, color: BRAND.grey }}>{s.email}</div>
                      </td>
                      <td style={S.td}>
                        <span style={S.tag}>{batch ? batch.name : "—"}</span>
                        {s.customFee != null && (
                          <div style={{ fontSize: 11, color: BRAND.red, marginTop: 3, fontWeight: 600 }}>
                            {fmtMMK(s.customFee)} (custom)
                          </div>
                        )}
                      </td>
                      <td style={S.td}>{s.subject}</td>
                      <td style={S.td}><Badge stage={s.status} /></td>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Strikes count={s.strikes} />
                          <button style={{ ...S.btn("small"), padding: "2px 6px", fontSize: 10 }} onClick={() => addStrike(s.id)} title="Add strike">+</button>
                          {s.strikes > 0 && <button style={{ ...S.btn("small"), padding: "2px 6px", fontSize: 10 }} onClick={() => removeStrike(s.id)} title="Remove strike">−</button>}
                        </div>
                      </td>
                      <td style={S.td}>{fmtDate(s.enrolledDate)}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={S.btn("small")} onClick={() => setEditing(s)}>Edit</button>
                          <button style={S.btn("small")} onClick={() => deleteStudent(s.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <StudentForm
          student={editing}
          batches={batches}
          onSave={saveStudent}
          onClose={() => { setShowAdd(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function StudentForm({ student, batches, onSave, onClose }) {
  const [form, setForm] = useState(
    student || {
      name: "", email: "", phone: "", batchId: batches[0]?.id || "",
      subject: "Computer Science", status: "Active", strikes: 0, customFee: null,
      enrolledDate: today(), parentName: "", parentPhone: "", parentFacebook: "",
      nameBurmese: "", telegram: "", notes: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const batchFee = batches.find((b) => b.id === form.batchId)?.fee ?? 0;

  async function handleSave() {
    if (!form.name) { alert("Name is required"); return; }
    setSaving(true);
    try {
      const saved = await onSave(form);
      if (!student && saved) {
        const batch = batches.find((b) => b.id === saved.batchId);
        setReceiptData({
          studentName: saved.name,
          nameBurmese: saved.nameBurmese || "",
          studentEmail: saved.email || "",
          batchName: batch ? batch.name : "—",
          paidDate: saved.enrolledDate || today(),
          amount: saved.customFee != null ? saved.customFee : (batch ? batch.fee : 0),
          invoiceNumber: "",
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (receiptData) {
    return (
      <Modal title="Receipt — First Payment" onClose={onClose}>
        <ReceiptPreview payment={receiptData} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button style={S.btn("secondary")} onClick={onClose}>Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={student ? "Edit Student" : "Add Student"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.formGroup}><label style={S.formLabel}>Full Name (English) *</label><input style={S.input} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Burmese Name</label><input style={S.input} value={form.nameBurmese || ""} onChange={(e) => set("nameBurmese", e.target.value)} placeholder="မြန်မာနာမည်" /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Email</label><input style={S.input} value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Phone</label><input style={S.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Telegram</label><input style={S.input} value={form.telegram || ""} onChange={(e) => set("telegram", e.target.value)} placeholder="@username" /></div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Batch *</label>
          <select style={S.select} value={form.batchId} onChange={(e) => set("batchId", e.target.value)}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Subject</label>
          <select style={S.select} value={form.subject} onChange={(e) => set("subject", e.target.value)}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Status</label>
          <select style={S.select} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expelled">Expelled</option>
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Custom Fee (MMK)</label>
          <input
            style={S.input}
            type="number"
            value={form.customFee ?? ""}
            onChange={(e) => set("customFee", e.target.value === "" ? null : parseInt(e.target.value))}
            placeholder={`Batch default: ${fmtMMK(batchFee)}`}
          />
        </div>
        <div style={S.formGroup}><label style={S.formLabel}>Enrolled Date</label><input style={S.input} type="date" value={fmtDateInput(form.enrolledDate)} onChange={(e) => set("enrolledDate", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Parent Name</label><input style={S.input} value={form.parentName} onChange={(e) => set("parentName", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Parent Phone</label><input style={S.input} value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Parent Facebook</label><input style={S.input} value={form.parentFacebook || ""} onChange={(e) => set("parentFacebook", e.target.value)} placeholder="Facebook username or profile URL" /></div>
      </div>
      <div style={S.formGroup}><label style={S.formLabel}>Notes</label><textarea style={{ ...S.input, height: 60, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
        <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : student ? "Save Student" : "Save & Generate Receipt"}
        </button>
      </div>
    </Modal>
  );
}

// ─── BATCHES ─────────────────────────────────────────────────────
function BatchesPage({ batches, students, onSaveBatch, onDeleteBatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  async function saveBatch(batch) {
    try {
      await onSaveBatch(batch);
      setShowAdd(false);
      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteBatch(id) {
    const hasStudents = students.some((s) => s.batchId === id);
    if (hasStudents) return alert("Cannot delete a batch that has enrolled students.");
    if (!confirm("Delete this batch?")) return;
    try {
      await onDeleteBatch(id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div style={S.pageTitle}>Batches</div>
      <div style={S.pageDesc}>Manage cohorts — max 15 students per batch</div>

      <div style={S.toolbar}>
        <button style={S.btn("primary")} onClick={() => setShowAdd(true)}>{ICONS.add} Add Batch</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {batches.map((b) => {
          const enrolled = students.filter((s) => s.batchId === b.id && s.status === "Active");
          const pct = Math.round((enrolled.length / b.maxStudents) * 100);
          const monthlyRevenue = enrolled.reduce((sum, s) => sum + (s.customFee != null ? s.customFee : b.fee), 0);
          return (
            <div key={b.id} style={S.card}>
              <div style={{ ...S.flexBetween, marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Montserrat', sans-serif" }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: BRAND.grey }}>{b.syllabus} • {b.days}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={S.btn("small")} onClick={() => setEditing(b)}>Edit</button>
                  <button style={S.btn("small")} onClick={() => deleteBatch(b.id)}>🗑️</button>
                </div>
              </div>
              <div style={{ ...S.flexBetween, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{enrolled.length} / {b.maxStudents} students</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: pct >= 90 ? BRAND.red : BRAND.green }}>{pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: BRAND.greyLight, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? BRAND.red : pct >= 70 ? BRAND.navyMid : BRAND.green, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 13, color: BRAND.grey }}>
                Fee: <strong style={{ color: BRAND.navy }}>{fmtMMK(b.fee)}</strong>/month
                &nbsp;·&nbsp; <strong style={{ color: BRAND.navy }}>{b.sessionsPerMonth || 8}</strong> sessions
              </div>
              {b.examSession && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={S.badge(
                    isExamPast(b.examDate) ? BRAND.grey : isExamSoon(b.examDate) ? BRAND.orange : BRAND.navy,
                    isExamPast(b.examDate) ? BRAND.greyLight : isExamSoon(b.examDate) ? BRAND.orangeLight : BRAND.blueLight
                  )}>
                    {isExamPast(b.examDate) ? "✓ Complete" : isExamSoon(b.examDate) ? "⚡ " : "🎯 "}{isExamPast(b.examDate) ? "" : b.examSession}
                  </span>
                  {b.examDate && (
                    <span style={{ fontSize: 12, color: BRAND.grey }}>
                      Exam: {fmtDate(b.examDate)}
                    </span>
                  )}
                </div>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BRAND.border}` }}>
                <div style={{ fontSize: 10, color: BRAND.grey, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>Monthly Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.red, fontFamily: "'Montserrat', sans-serif" }}>{fmtMMK(monthlyRevenue)}</div>
                <div style={{ fontSize: 11, color: BRAND.grey, marginTop: 2 }}>{enrolled.length} student{enrolled.length !== 1 ? "s" : ""} × fees</div>
              </div>

              {enrolled.length > 0 && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${BRAND.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.grey, marginBottom: 6, textTransform: "uppercase" }}>Enrolled</div>
                  {enrolled.map((s) => (
                    <div key={s.id} style={{ fontSize: 12, padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{s.name}</span>
                      <Strikes count={s.strikes} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(showAdd || editing) && (
        <BatchForm batch={editing} onSave={saveBatch} onClose={() => { setShowAdd(false); setEditing(null); }} />
      )}
    </div>
  );
}

function BatchForm({ batch, onSave, onClose }) {
  const [form, setForm] = useState(
    batch
      ? { examSession: "", examDate: "", sessionsPerMonth: 8, ...batch }
      : { name: "", syllabus: "CIE", days: "", maxStudents: 15, fee: 180000, examSession: "", examDate: "", sessionsPerMonth: 8 }
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Modal title={batch ? "Edit Batch" : "Add Batch"} onClose={onClose}>
      <div style={S.formGroup}><label style={S.formLabel}>Batch Name *</label><input style={S.input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. CIE 0478 — Sat/Mon" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Syllabus</label>
          <select style={S.select} value={form.syllabus} onChange={(e) => set("syllabus", e.target.value)}>
            <option value="CIE">CIE</option><option value="Edexcel">Edexcel</option>
          </select>
        </div>
        <div style={S.formGroup}><label style={S.formLabel}>Days</label><input style={S.input} value={form.days} onChange={(e) => set("days", e.target.value)} placeholder="e.g. Sat & Mon" /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Max Students</label><input style={S.input} type="number" value={form.maxStudents} onChange={(e) => set("maxStudents", parseInt(e.target.value) || 15)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Monthly Fee (MMK)</label><input style={S.input} type="number" value={form.fee} onChange={(e) => set("fee", parseInt(e.target.value) || 0)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Sessions / Month</label><input style={S.input} type="number" value={form.sessionsPerMonth || 8} onChange={(e) => set("sessionsPerMonth", parseInt(e.target.value) || 8)} /></div>
      </div>
      <div style={{ ...S.formGroup, marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.grey, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Exam Target</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={S.formGroup}><label style={S.formLabel}>Exam Session</label><input style={S.input} value={form.examSession || ""} onChange={(e) => set("examSession", e.target.value)} placeholder="e.g. Oct/Nov 2026" /></div>
          <div style={S.formGroup}><label style={S.formLabel}>Exam Date</label><input style={S.input} type="date" value={form.examDate || ""} onChange={(e) => set("examDate", e.target.value)} /></div>
        </div>
        <div style={{ fontSize: 12, color: BRAND.grey }}>Invoices stop after the exam month. Leave blank for open-ended batches.</div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
        <button style={S.btn("primary")} onClick={() => form.name ? onSave(form) : alert("Name is required")}>Save Batch</button>
      </div>
    </Modal>
  );
}

// ─── INVOICES ────────────────────────────────────────────────────
function InvoicesPage({ invoices, students, batches, settings, onMarkPaid, onDeleteInvoice, onGenerateInvoices }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [preview, setPreview] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [pendingPaid, setPendingPaid] = useState(new Set());

  useEffect(() => setSelected(new Set()), [search, filterStatus, dueDateFrom, dueDateTo]);

  const hasDateFilter = dueDateFrom || dueDateTo;

  const filtered = invoices
    .filter((inv) => {
      if (filterStatus !== "all" && inv.status !== filterStatus) return false;
      if (dueDateFrom && inv.dueDate && inv.dueDate < dueDateFrom) return false;
      if (dueDateTo && inv.dueDate && inv.dueDate > dueDateTo) return false;
      if (search) {
        const s = search.toLowerCase();
        return inv.invoiceNumber.toLowerCase().includes(s) || inv.studentName.toLowerCase().includes(s);
      }
      return true;
    })
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  // Rows being processed are hidden immediately on click
  const visible = filtered.filter((inv) => !pendingPaid.has(inv.id));

  async function generateMonthlyInvoices() {
    try {
      const count = await onGenerateInvoices();
      setShowGenerate(false);
      alert(`${count} invoice${count !== 1 ? "s" : ""} generated.`);
    } catch (err) {
      setShowGenerate(false);
      alert(err.message);
    }
  }

  async function markPaid(id) {
    setPendingPaid((p) => new Set([...p, id]));
    try {
      await onMarkPaid(id);
    } catch (err) {
      setPendingPaid((p) => { const n = new Set(p); n.delete(id); return n; });
      alert(err.message);
    }
  }

  async function deleteInvoice(id) {
    if (!confirm("Delete this invoice?")) return;
    try {
      await onDeleteInvoice(id);
    } catch (err) {
      alert(err.message);
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(
      selected.size === visible.length && visible.length > 0
        ? new Set()
        : new Set(visible.map((i) => i.id))
    );
  }

  async function bulkMarkPaid() {
    const toMark = visible.filter((i) => selected.has(i.id) && (i.status === "Unpaid" || i.status === "Overdue"));
    if (toMark.length === 0) return alert("No unpaid invoices in the selection.");
    const ids = toMark.map((i) => i.id);
    setPendingPaid((p) => new Set([...p, ...ids]));
    try {
      await Promise.all(ids.map((id) => onMarkPaid(id)));
      setSelected(new Set());
    } catch (err) {
      setPendingPaid((p) => { const n = new Set(p); ids.forEach((id) => n.delete(id)); return n; });
      alert(err.message);
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} selected invoice${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      await Promise.all([...selected].map((id) => onDeleteInvoice(id)));
      setSelected(new Set());
    } catch (err) {
      alert(err.message);
    }
  }

  const allSelected = visible.length > 0 && visible.every((i) => selected.has(i.id));

  const totalUnpaid = invoices
    .filter((i) => i.status === "Unpaid" || i.status === "Overdue")
    .reduce((s, i) => s + i.amount - i.amountPaid, 0);
  const totalPaidThisMonth = invoices
    .filter((i) => i.status === "Paid" && i.paidDate && monthKey(i.paidDate) === currentMonthKey())
    .reduce((s, i) => s + i.amountPaid, 0);

  let toInvoiceCount = 0;
  let examExcludedCount = 0;
  for (const s of students) {
    if (s.status !== "Active") continue;
    const studentInvs = invoices.filter((i) => i.studentId === s.id);
    if (studentInvs.some((i) => i.status === "Unpaid" || i.status === "Overdue")) continue;
    const lastInv = studentInvs.slice().sort((a, b) =>
      (b.periodEnd || b.dueDate || "").localeCompare(a.periodEnd || a.dueDate || "")
    )[0];
    const periodStart = lastInv
      ? (lastInv.periodEnd || lastInv.dueDate)
      : (s.enrolledDate || today());
    const batch = batches.find((b) => b.id === s.batchId);
    if (batch && batch.examDate && periodStart.slice(0, 7) > batch.examDate.slice(0, 7)) {
      examExcludedCount++;
    } else {
      toInvoiceCount++;
    }
  }

  return (
    <div>
      <div style={S.pageTitle}>Invoices</div>
      <div style={S.pageDesc}>Auto-generated monthly invoices — minimal manual work</div>

      <div style={S.statsRow}>
        <div style={S.statCard(BRAND.green)}>
          <div style={S.statNum}>{fmtMMK(totalPaidThisMonth)}</div>
          <div style={S.statLabel}>Collected This Month</div>
        </div>
        <div style={S.statCard(BRAND.orange)}>
          <div style={S.statNum}>{fmtMMK(totalUnpaid)}</div>
          <div style={S.statLabel}>Outstanding Balance</div>
        </div>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>{ICONS.search}</span>
          <input style={S.searchInput} placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select style={{ ...S.select, width: "auto", minWidth: 120 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: BRAND.grey, whiteSpace: "nowrap" }}>Due:</span>
          <input
            style={{ ...S.input, width: 140, fontSize: 13 }}
            type="date"
            value={dueDateFrom}
            onChange={(e) => setDueDateFrom(e.target.value)}
            title="Due date from"
          />
          <span style={{ fontSize: 12, color: BRAND.grey }}>–</span>
          <input
            style={{ ...S.input, width: 140, fontSize: 13 }}
            type="date"
            value={dueDateTo}
            onChange={(e) => setDueDateTo(e.target.value)}
            title="Due date to"
          />
          {hasDateFilter && (
            <button
              style={{ ...S.btn("small"), color: BRAND.red, padding: "4px 8px" }}
              onClick={() => { setDueDateFrom(""); setDueDateTo(""); }}
              title="Clear date filter"
            >✕</button>
          )}
        </div>
        <button style={S.btn("gold")} onClick={() => setShowGenerate(true)}>{ICONS.money} Generate Monthly Invoices</button>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: BRAND.blueLight, border: `1px solid ${BRAND.navyMid}33`, borderRadius: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.navy }}>{selected.size} selected</span>
          <button style={S.btn("success")} onClick={bulkMarkPaid}>✅ Mark Paid</button>
          <button style={S.btn("danger")} onClick={bulkDelete}>🗑️ Delete</button>
          <button style={{ ...S.btn("secondary"), marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div style={S.card}>
        {filtered.length === 0 ? (
          <EmptyState icon="🧾" message="No invoices yet" action={<button style={S.btn("gold")} onClick={() => setShowGenerate(true)}>Generate Invoices</button>} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 36, paddingRight: 4 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", width: 15, height: 15 }}
                      title="Select all"
                    />
                  </th>
                  <th style={S.th}>Invoice #</th>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>Batch</th>
                  <th style={S.th}>Period</th>
                  <th style={S.th}>Amount</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Due Date</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ background: selected.has(inv.id) ? BRAND.blueLight : "transparent" }}
                    onMouseEnter={(e) => { if (!selected.has(inv.id)) e.currentTarget.style.background = BRAND.surface; }}
                    onMouseLeave={(e) => { if (!selected.has(inv.id)) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ ...S.td, width: 36, paddingRight: 4 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        style={{ cursor: "pointer", width: 15, height: 15 }}
                      />
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                    <td style={S.td}>{inv.studentName}</td>
                    <td style={S.td}><span style={S.tag}>{inv.batchName}</span></td>
                    <td style={{ ...S.td, whiteSpace: "nowrap", fontSize: 12 }}>
                      {inv.periodStart ? fmtPeriod(inv.periodStart, inv.periodEnd) : inv.monthKey}
                    </td>
                    <td style={S.td}>{fmtMMK(inv.amount)}</td>
                    <td style={S.td}><Badge stage={inv.status} /></td>
                    <td style={S.td}>{fmtDate(inv.dueDate)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={S.btn("small")} onClick={() => setPreview(inv)} title="Preview">👁️</button>
                        {(inv.status === "Unpaid" || inv.status === "Overdue") && (
                          <button style={S.btn("success")} onClick={() => markPaid(inv.id)}>Mark Paid</button>
                        )}
                        <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => deleteInvoice(inv.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerate && (
        <Modal title="Generate Monthly Invoices" onClose={() => setShowGenerate(false)}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            For each active student with no unpaid invoices, this generates <strong>all overdue periods</strong> since
            their last paid invoice date (or enrollment date). Multiple catch-up invoices are created if several months have passed.
          </p>
          <p style={{ fontSize: 13, color: BRAND.grey, marginBottom: examExcludedCount > 0 ? 8 : 20 }}>
            Students to invoice: <strong>{toInvoiceCount}</strong>
          </p>
          {examExcludedCount > 0 && (
            <p style={{ fontSize: 13, color: BRAND.grey, marginBottom: 20, padding: "8px 12px", background: BRAND.orangeLight, borderRadius: 6 }}>
              Excluded — exam period over: <strong style={{ color: BRAND.orange }}>{examExcludedCount}</strong> student{examExcludedCount !== 1 ? "s" : ""}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button style={S.btn("secondary")} onClick={() => setShowGenerate(false)}>Cancel</button>
            <button style={S.btn("gold")} onClick={generateMonthlyInvoices}>Generate Now</button>
          </div>
        </Modal>
      )}

      {preview && (
        <Modal title="Invoice Preview" onClose={() => setPreview(null)}>
          <InvoicePreview invoice={preview} settings={settings} />
        </Modal>
      )}
    </div>
  );
}

function InvoicePreview({ invoice, settings }) {
  const previewRef = useRef(null);
  const [saving, setSaving] = useState(false);

  async function saveAsImage() {
    if (!previewRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Could not save image: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
    <div ref={previewRef} style={S.invoicePreview}>
      <div style={{ ...S.flexBetween, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif", letterSpacing: "-0.5px" }}>
            Speak<span style={{ color: BRAND.red }}>Up</span>
          </div>
          <div style={{ fontSize: 11, color: BRAND.grey, letterSpacing: "2px", textTransform: "uppercase" }}>English School</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif" }}>INVOICE</div>
          <div style={{ fontSize: 13, color: BRAND.grey, fontFamily: "monospace" }}>{invoice.invoiceNumber}</div>
        </div>
      </div>

      <div style={{ borderTop: `2px solid ${BRAND.navy}`, paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: BRAND.grey, fontSize: 11, textTransform: "uppercase" }}>Bill To</div>
            <div style={{ fontWeight: 600 }}>{invoice.studentName}</div>
            <div style={{ color: BRAND.grey }}>{invoice.studentEmail}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {invoice.dueDate && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: BRAND.grey }}>Billing Period:</span>{" "}
                <strong>{fmtPeriod(invoice.dueDate, addOneMonth(invoice.dueDate))}</strong>
              </div>
            )}
            <div><span style={{ color: BRAND.grey }}>Issue Date:</span> {fmtDate(invoice.issueDate)}</div>
            <div><span style={{ color: BRAND.grey }}>Due Date:</span> {fmtDate(invoice.dueDate)}</div>
            <div style={{ marginTop: 6 }}><Badge stage={invoice.status} /></div>
          </div>
        </div>
      </div>

      <table style={{ ...S.table, marginBottom: 20 }}>
        <thead>
          <tr>
            <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}` }}>Description</th>
            <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}`, textAlign: "center" }}>Qty</th>
            <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}`, textAlign: "right" }}>Rate</th>
            <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}`, textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, i) => {
            const correctedDesc = invoice.dueDate && item.desc
              ? item.desc.replace(/ · .+$/, ` · ${fmtPeriod(invoice.dueDate, addOneMonth(invoice.dueDate))}`)
              : item.desc;
            return (
            <tr key={i}>
              <td style={S.td}>{correctedDesc}</td>
              <td style={{ ...S.td, textAlign: "center" }}>{item.qty}</td>
              <td style={{ ...S.td, textAlign: "right" }}>{fmtMMK(item.rate)}</td>
              <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{fmtMMK(item.qty * item.rate)}</td>
            </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ borderTop: `2px solid ${BRAND.navy}`, paddingTop: 12, textAlign: "right" }}>
        <div style={{ fontSize: 13, color: BRAND.grey, marginBottom: 4 }}>Total Due</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.red, fontFamily: "'Montserrat', sans-serif" }}>{fmtMMK(invoice.amount)}</div>
        {invoice.status === "Paid" && <div style={{ fontSize: 12, color: BRAND.green, marginTop: 4 }}>Paid on {fmtDate(invoice.paidDate)}</div>}
      </div>

      <div style={{ marginTop: 24, padding: "12px 16px", background: BRAND.blueLight, borderRadius: 6, fontSize: 12, color: BRAND.grey }}>
        <strong style={{ color: BRAND.navy }}>SpeakUp English</strong> — Speak your future. Fluency starts here.
      </div>
    </div>

    <div style={{ textAlign: "center", marginTop: 16 }}>
      <button style={S.btn("primary")} onClick={saveAsImage} disabled={saving}>
        {saving ? "Saving…" : `${ICONS.download} Save as Image`}
      </button>
    </div>
    </div>
  );
}

// ─── RECEIPT PREVIEW ─────────────────────────────────────────────
function ReceiptPreview({ payment: ph }) {
  const receiptRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const billingStart = ph.periodStart || ph.paidDate;
  const billingEnd = ph.periodEnd || addOneMonth(billingStart);

  async function saveAsImage() {
    if (!receiptRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `Receipt-${ph.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Could not save image: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div ref={receiptRef} style={S.invoicePreview}>
        <div style={{ ...S.flexBetween, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.navy, fontFamily: "'Montserrat', sans-serif", letterSpacing: "-0.5px" }}>
              Speak<span style={{ color: BRAND.red }}>Up</span>
            </div>
            <div style={{ fontSize: 11, color: BRAND.grey, letterSpacing: "2px", textTransform: "uppercase" }}>English School</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.green, fontFamily: "'Montserrat', sans-serif" }}>RECEIPT</div>
            <div style={{ fontSize: 13, color: BRAND.grey, fontFamily: "monospace" }}>{ph.invoiceNumber}</div>
          </div>
        </div>

        <div style={{ borderTop: `2px solid ${BRAND.navy}`, paddingTop: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: BRAND.grey, fontSize: 11, textTransform: "uppercase" }}>Received From</div>
              <div style={{ fontWeight: 600 }}>{ph.studentName}</div>
              {ph.nameBurmese && <div style={{ color: BRAND.navy }}>{ph.nameBurmese}</div>}
              {ph.studentEmail && <div style={{ color: BRAND.grey, fontSize: 12 }}>{ph.studentEmail}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: BRAND.grey }}>Billing Period:</span>{" "}
                <strong>{fmtPeriod(billingStart, billingEnd)}</strong>
              </div>
              <div><span style={{ color: BRAND.grey }}>Paid Date:</span> {fmtDate(ph.paidDate)}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ ...S.badge(BRAND.green, BRAND.greenLight), fontSize: 12, padding: "3px 10px" }}>PAID</span>
              </div>
            </div>
          </div>
        </div>

        <table style={{ ...S.table, marginBottom: 20 }}>
          <thead>
            <tr>
              <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}` }}>Description</th>
              <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}`, textAlign: "center" }}>Qty</th>
              <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}`, textAlign: "right" }}>Rate</th>
              <th style={{ ...S.th, borderBottom: `2px solid ${BRAND.navy}`, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>{ph.batchName} · {fmtPeriod(billingStart, billingEnd)}</td>
              <td style={{ ...S.td, textAlign: "center" }}>1</td>
              <td style={{ ...S.td, textAlign: "right" }}>{fmtMMK(ph.amount)}</td>
              <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{fmtMMK(ph.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: `2px solid ${BRAND.navy}`, paddingTop: 12, textAlign: "right" }}>
          <div style={{ fontSize: 13, color: BRAND.grey, marginBottom: 4 }}>Amount Paid</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.green, fontFamily: "'Montserrat', sans-serif" }}>{fmtMMK(ph.amount)}</div>
        </div>

        <div style={{ marginTop: 24, padding: "12px 16px", background: BRAND.blueLight, borderRadius: 6, fontSize: 12, color: BRAND.grey }}>
          <strong style={{ color: BRAND.navy }}>SpeakUp English</strong> — Speak your future. Fluency starts here.
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button style={S.btn("primary")} onClick={saveAsImage} disabled={saving}>
          {saving ? "Saving…" : `${ICONS.download} Save as Image`}
        </button>
      </div>
    </div>
  );
}

// ─── PAYMENT HISTORY ─────────────────────────────────────────────
function PaymentHistoryPage({ paymentHistory, batches, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const filtered = paymentHistory.filter((ph) => {
    if (filterBatch !== "all" && ph.batchId !== filterBatch) return false;
    if (dateFrom && ph.paidDate < dateFrom) return false;
    if (dateTo && ph.paidDate > dateTo) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        ph.studentName.toLowerCase().includes(s) ||
        (ph.nameBurmese && ph.nameBurmese.toLowerCase().includes(s)) ||
        ph.invoiceNumber.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Clear selection when filters change
  useEffect(() => setSelected(new Set()), [search, filterBatch, dateFrom, dateTo]);

  const totalCollected = filtered.reduce((sum, ph) => sum + ph.amount, 0);
  const selectedTotal = filtered.filter((ph) => selected.has(ph.id)).reduce((sum, ph) => sum + ph.amount, 0);
  const hasDateFilter = dateFrom || dateTo;
  const allSelected = filtered.length > 0 && filtered.every((ph) => selected.has(ph.id));

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((ph) => ph.id)));
  }

  async function deleteOne(ph) {
    if (!confirm(`Delete payment record for ${ph.studentName}? This also removes the next auto-generated invoice.`)) return;
    try { await onDelete(ph.id); } catch (err) { alert(err.message); }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} selected record${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      await Promise.all([...selected].map((id) => onDelete(id)));
      setSelected(new Set());
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div style={S.pageTitle}>Payment History</div>
      <div style={S.pageDesc}>Record of every received payment — invoices removed after payment</div>

      <div style={S.statsRow}>
        <div style={S.statCard(BRAND.green)}>
          <div style={S.statNum}>{filtered.length}</div>
          <div style={S.statLabel}>Payments Shown</div>
        </div>
        <div style={S.statCard(BRAND.red)}>
          <div style={S.statNum}>{fmtMMK(totalCollected)}</div>
          <div style={S.statLabel}>Total Collected</div>
        </div>
        {selected.size > 0 && (
          <div style={S.statCard(BRAND.navy)}>
            <div style={S.statNum}>{selected.size}</div>
            <div style={S.statLabel}>Selected · {fmtMMK(selectedTotal)}</div>
          </div>
        )}
      </div>

      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>{ICONS.search}</span>
          <input style={S.searchInput} placeholder="Search by student name or invoice #..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select style={{ ...S.select, width: "auto", minWidth: 160 }} value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
          <option value="all">All Batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: BRAND.grey, whiteSpace: "nowrap" }}>Paid:</span>
          <input style={{ ...S.input, width: 140, fontSize: 13 }} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From" />
          <span style={{ fontSize: 12, color: BRAND.grey }}>–</span>
          <input style={{ ...S.input, width: 140, fontSize: 13 }} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To" />
          {hasDateFilter && (
            <button style={{ ...S.btn("small"), color: BRAND.red, padding: "4px 8px" }} onClick={() => { setDateFrom(""); setDateTo(""); }} title="Clear">✕</button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: BRAND.blueLight, border: `1px solid ${BRAND.navyMid}33`, borderRadius: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.navy }}>{selected.size} selected</span>
          <button style={S.btn("danger")} onClick={bulkDelete}>🗑️ Delete Selected</button>
          <button style={{ ...S.btn("secondary"), marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div style={S.card}>
        {filtered.length === 0 ? (
          <EmptyState icon="💳" message="No payment records yet. Payments appear here when invoices are marked as paid." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 36, paddingRight: 4 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", width: 15, height: 15 }}
                      title="Select all"
                    />
                  </th>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>Batch</th>
                  <th style={S.th}>Invoice #</th>
                  <th style={S.th}>Period</th>
                  <th style={S.th}>Amount</th>
                  <th style={S.th}>Paid Date</th>
                  <th style={S.th}>Payment #</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ph) => (
                  <tr
                    key={ph.id}
                    style={{ background: selected.has(ph.id) ? BRAND.blueLight : "transparent" }}
                    onMouseEnter={(e) => { if (!selected.has(ph.id)) e.currentTarget.style.background = BRAND.surface; }}
                    onMouseLeave={(e) => { if (!selected.has(ph.id)) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ ...S.td, width: 36, paddingRight: 4 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(ph.id)}
                        onChange={() => toggleSelect(ph.id)}
                        style={{ cursor: "pointer", width: 15, height: 15 }}
                      />
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{ph.studentName}</div>
                      {ph.nameBurmese && <div style={{ fontSize: 12, color: BRAND.navy }}>{ph.nameBurmese}</div>}
                      <div style={{ fontSize: 11, color: BRAND.grey }}>{ph.studentEmail}</div>
                    </td>
                    <td style={S.td}><span style={S.tag}>{ph.batchName}</span></td>
                    <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12 }}>{ph.invoiceNumber}</td>
                    <td style={{ ...S.td, fontSize: 12, whiteSpace: "nowrap" }}>
                      {ph.periodStart ? fmtPeriod(ph.periodStart, ph.periodEnd) : "—"}
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: BRAND.green }}>{fmtMMK(ph.amount)}</td>
                    <td style={S.td}>{fmtDate(ph.paidDate)}</td>
                    <td style={S.td}>
                      <span style={S.badge(BRAND.red, BRAND.redTint)}>#{ph.paymentCount}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={S.btn("small")} onClick={() => setReceipt(ph)} title="Generate Receipt">🧾 Receipt</button>
                        <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => deleteOne(ph)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {receipt && (
        <Modal title="Payment Receipt" onClose={() => setReceipt(null)}>
          <ReceiptPreview payment={receipt} />
        </Modal>
      )}
    </div>
  );
}

// ─── CRM ─────────────────────────────────────────────────────────
function CRMPage({ leads, batches, onSaveLead, onDeleteLead, onMoveStage, onConvertToStudent }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState("pipeline");

  const stageColors = [BRAND.navyMid, BRAND.orange, BRAND.green, BRAND.red];

  async function saveLead(lead) {
    try {
      await onSaveLead(lead);
      setShowAdd(false);
      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteLead(id) {
    if (!confirm("Delete this lead?")) return;
    try {
      await onDeleteLead(id);
      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  }

  async function moveStage(id, newStage) {
    try {
      await onMoveStage(id, newStage);
    } catch (err) {
      alert(err.message);
    }
  }

  async function convertToStudent(lead) {
    try {
      await onConvertToStudent(lead.id);
      alert(`${lead.name} converted to student and moved to Customer stage.`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div style={S.pageTitle}>CRM</div>
      <div style={S.pageDesc}>Track leads from Prospect → Lead → Customer → Raving Fan</div>

      <div style={S.toolbar}>
        <button style={S.btn("primary")} onClick={() => setShowAdd(true)}>{ICONS.add} Add Lead</button>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button style={S.btn(viewMode === "pipeline" ? "primary" : "secondary")} onClick={() => setViewMode("pipeline")}>Pipeline</button>
          <button style={S.btn(viewMode === "table" ? "primary" : "secondary")} onClick={() => setViewMode("table")}>Table</button>
        </div>
      </div>

      {viewMode === "pipeline" ? (
        <div style={S.pipelineRow}>
          {CRM_STAGES.map((stage, si) => {
            const stageLeads = leads
              .filter((l) => l.stage === stage)
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            return (
              <div key={stage} style={S.pipelineCol(stageColors[si])}>
                <div style={S.pipelineHeader}>
                  <span>{stage}</span>
                  <span style={{ ...S.badge(stageColors[si], stageColors[si] + "22"), fontSize: 12 }}>{stageLeads.length}</span>
                </div>
                <div style={{ maxHeight: 500, overflow: "auto" }}>
                  {stageLeads.map((l) => (
                    <div key={l.id} style={S.pipelineCard} onClick={() => setEditing(l)} onMouseEnter={(e) => e.currentTarget.style.background = BRAND.surface} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: BRAND.grey, marginBottom: 6 }}>{l.source} • {fmtDate(l.createdAt)}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {si < 3 && (
                          <button style={{ ...S.btn("small"), fontSize: 10, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); moveStage(l.id, CRM_STAGES[si + 1]); }}>
                            → {CRM_STAGES[si + 1]}
                          </button>
                        )}
                        {stage === "Lead" && (
                          <button style={{ ...S.btn("small"), fontSize: 10, padding: "2px 8px", background: BRAND.greenLight, color: BRAND.green }} onClick={(e) => { e.stopPropagation(); convertToStudent(l); }}>
                            Convert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{ padding: 16, fontSize: 12, color: BRAND.grey, textAlign: "center" }}>No leads</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Stage</th>
                  <th style={S.th}>Source</th>
                  <th style={S.th}>Phone</th>
                  <th style={S.th}>Created</th>
                  <th style={S.th}>Follow-up</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((l) => (
                  <tr key={l.id} onMouseEnter={(e) => e.currentTarget.style.background = BRAND.surface} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: BRAND.grey }}>{l.email}</div>
                    </td>
                    <td style={S.td}><Badge stage={l.stage} /></td>
                    <td style={S.td}>{l.source}</td>
                    <td style={S.td}>{l.phone}</td>
                    <td style={S.td}>{fmtDate(l.createdAt)}</td>
                    <td style={S.td}>
                      {l.followUpDate ? (
                        <span style={{ color: l.followUpDate <= today() ? BRAND.errorRed : BRAND.grey, fontSize: 12 }}>
                          {l.followUpDate <= today() ? "⚠️ " : ""}{fmtDate(l.followUpDate)}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={S.btn("small")} onClick={() => setEditing(l)}>Edit</button>
                        {l.stage === "Lead" && <button style={{ ...S.btn("small"), color: BRAND.green }} onClick={() => convertToStudent(l)}>Convert</button>}
                        <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => deleteLead(l.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showAdd || editing) && (
        <LeadForm
          lead={editing}
          onSave={saveLead}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onDelete={editing ? () => deleteLead(editing.id) : null}
        />
      )}
    </div>
  );
}

function LeadForm({ lead, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(
    lead || {
      name: "", email: "", phone: "", parentName: "", parentPhone: "",
      source: "Facebook DM", stage: "Prospect", notes: "",
      createdAt: today(), updatedAt: today(), followUpDate: "",
      interestLevel: "Medium", convertedStudentId: null,
    }
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v, updatedAt: today() }));

  return (
    <Modal title={lead ? "Edit Lead" : "Add Lead"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.formGroup}><label style={S.formLabel}>Full Name *</label><input style={S.input} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Email</label><input style={S.input} value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Phone</label><input style={S.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Source</label>
          <select style={S.select} value={form.source} onChange={(e) => set("source", e.target.value)}>
            <option>Facebook DM</option><option>Facebook Group</option><option>Referral</option>
            <option>Campus Rep (Yoon Mo Mo)</option><option>Website</option><option>Walk-in</option><option>Other</option>
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Stage</label>
          <select style={S.select} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {CRM_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Interest Level</label>
          <select style={S.select} value={form.interestLevel} onChange={(e) => set("interestLevel", e.target.value)}>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
        <div style={S.formGroup}><label style={S.formLabel}>Parent Name</label><input style={S.input} value={form.parentName} onChange={(e) => set("parentName", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Parent Phone</label><input style={S.input} value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Follow-up Date</label><input style={S.input} type="date" value={form.followUpDate || ""} onChange={(e) => set("followUpDate", e.target.value)} /></div>
      </div>
      <div style={S.formGroup}><label style={S.formLabel}>Notes</label><textarea style={{ ...S.input, height: 70, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interaction history, preferences, etc." /></div>
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", marginTop: 12 }}>
        <div>{onDelete && <button style={S.btn("danger")} onClick={onDelete}>Delete</button>}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
          <button style={S.btn("primary")} onClick={() => form.name ? onSave(form) : alert("Name is required")}>Save Lead</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── TEACHERS ────────────────────────────────────────────────────
function TeachersPage({ teachers, teacherSalaries, onSaveTeacher, onDeleteTeacher, onMarkSalaryPaid, onAddSalaryRecord, onDeleteSalaryRecord }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyTeacher, setHistoryTeacher] = useState(null);

  const teachingStaff = teachers.filter((t) => t.department !== "Marketing");
  const filtered = teachingStaff.filter((t) =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.nameBurmese && t.nameBurmese.toLowerCase().includes(search.toLowerCase()))
  );

  const activeTeachers = teachingStaff.filter((t) => t.status === "Active");
  const mk = currentMonthKey();
  const totalMonthlySalary = activeTeachers.reduce((s, t) => s + (t.monthlySalary || 0), 0);
  const teachingIds = new Set(activeTeachers.map((t) => t.id));
  const paidThisMonth = teacherSalaries
    .filter((s) => teachingIds.has(s.teacherId) && s.monthKey === mk && s.status === "Paid")
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingThisMonth = activeTeachers.reduce((sum, t) => {
    const { status } = getSalaryStatus(t, teacherSalaries);
    return status !== "paid" ? sum + (t.monthlySalary || 0) : sum;
  }, 0);

  async function deleteTeacher(id) {
    if (!confirm("Delete this teacher?")) return;
    try { await onDeleteTeacher(id); } catch (err) { alert(err.message); }
  }

  async function markPaid(teacher) {
    try { await onMarkSalaryPaid(teacher.id); } catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div style={S.pageTitle}>Teachers</div>
      <div style={S.pageDesc}>Manage staff and track monthly salary payments in real time</div>

      <div style={S.statsRow}>
        <div style={S.statCard(BRAND.red)}>
          <div style={S.statNum}>{activeTeachers.length}</div>
          <div style={S.statLabel}>Active Teachers</div>
        </div>
        <div style={S.statCard(BRAND.navy)}>
          <div style={S.statNum}>{fmtMMK(totalMonthlySalary)}</div>
          <div style={S.statLabel}>Monthly Salary Budget</div>
        </div>
        <div style={S.statCard(BRAND.green)}>
          <div style={S.statNum}>{fmtMMK(paidThisMonth)}</div>
          <div style={S.statLabel}>Paid This Month</div>
        </div>
        <div style={S.statCard(BRAND.orange)}>
          <div style={S.statNum}>{fmtMMK(pendingThisMonth)}</div>
          <div style={S.statLabel}>Pending This Month</div>
        </div>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>{ICONS.search}</span>
          <input style={S.searchInput} placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button style={S.btn("primary")} onClick={() => setShowAdd(true)}>{ICONS.add} Add Teacher</button>
      </div>

      <div style={S.card}>
        {filtered.length === 0 ? (
          <EmptyState icon="🧑‍🏫" message="No teachers yet" action={<button style={S.btn("primary")} onClick={() => setShowAdd(true)}>Add First Teacher</button>} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Contact</th>
                  <th style={S.th}>Subject / Role</th>
                  <th style={S.th}>Monthly Salary</th>
                  <th style={S.th}>Pay Day</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>This Month</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const { status: salStatus, record } = getSalaryStatus(t, teacherSalaries);
                  const ss = SALARY_STATUS_STYLE[salStatus];
                  return (
                    <tr key={t.id} onMouseEnter={(e) => e.currentTarget.style.background = BRAND.surface} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        {t.nameBurmese && <div style={{ fontSize: 12, color: BRAND.navy }}>{t.nameBurmese}</div>}
                        {t.email && <div style={{ fontSize: 11, color: BRAND.grey }}>{t.email}</div>}
                      </td>
                      <td style={S.td}>
                        {t.phone && <div style={{ fontSize: 12 }}>📞 {t.phone}</div>}
                        {t.telegram && <div style={{ fontSize: 12, color: BRAND.navyMid }}>✈️ {t.telegram}</div>}
                        {t.facebook && <div style={{ fontSize: 11, color: BRAND.grey }}>fb: {t.facebook}</div>}
                      </td>
                      <td style={S.td}>{t.subject || "—"}</td>
                      <td style={S.td}>
                        <strong style={{ color: BRAND.navy, fontFamily: "'Montserrat', sans-serif" }}>{fmtMMK(t.monthlySalary || 0)}</strong>
                      </td>
                      <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                        {t.salaryPayDay ? `${t.salaryPayDay}${nth(t.salaryPayDay)} of month` : "—"}
                      </td>
                      <td style={S.td}><Badge stage={t.status} /></td>
                      <td style={S.td}>
                        <span style={S.badge(ss.color, ss.bg)}>{ss.label}</span>
                        {record?.paidDate && (
                          <div style={{ fontSize: 10, color: BRAND.grey, marginTop: 3 }}>
                            Paid {fmtDate(record.paidDate)}
                          </div>
                        )}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {salStatus !== "paid" && t.status === "Active" && (
                            <button style={{ ...S.btn("success"), padding: "4px 10px", fontSize: 12 }} onClick={() => markPaid(t)}>
                              ✓ Pay
                            </button>
                          )}
                          <button style={S.btn("small")} onClick={() => setHistoryTeacher(t)}>History</button>
                          <button style={S.btn("small")} onClick={() => setEditing(t)}>Edit</button>
                          <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => deleteTeacher(t.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <TeacherForm
          teacher={editing}
          department="Teaching"
          onSave={async (d) => { await onSaveTeacher(d); setShowAdd(false); setEditing(null); }}
          onClose={() => { setShowAdd(false); setEditing(null); }}
        />
      )}

      {historyTeacher && (
        <SalaryHistoryModal
          teacher={historyTeacher}
          salaries={teacherSalaries.filter((s) => s.teacherId === historyTeacher.id)}
          onMarkPaid={onMarkSalaryPaid}
          onAdd={onAddSalaryRecord}
          onDelete={onDeleteSalaryRecord}
          onClose={() => setHistoryTeacher(null)}
        />
      )}
    </div>
  );
}

function TeacherForm({ teacher, department = "Teaching", onSave, onClose }) {
  const [form, setForm] = useState(
    teacher || {
      name: "", nameBurmese: "", email: "", phone: "", telegram: "", facebook: "",
      subject: department === "Marketing" ? "Graphic Designer" : "English",
      monthlySalary: 0, salaryPayDay: 1,
      status: "Active", joinDate: today(), notes: "",
      department,
    }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isMarketing = (form.department || department) === "Marketing";

  async function handleSave() {
    if (!form.name) { alert("Name is required"); return; }
    setSaving(true);
    try { await onSave({ ...form, department: form.department || department }); } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={teacher ? `Edit ${isMarketing ? "Staff Member" : "Teacher"}` : `Add ${isMarketing ? "Staff Member" : "Teacher"}`} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.formGroup}><label style={S.formLabel}>Full Name (English) *</label><input style={S.input} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Burmese Name</label><input style={S.input} value={form.nameBurmese || ""} onChange={(e) => set("nameBurmese", e.target.value)} placeholder="မြန်မာနာမည်" /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Email</label><input style={S.input} value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Phone</label><input style={S.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Telegram</label><input style={S.input} value={form.telegram || ""} onChange={(e) => set("telegram", e.target.value)} placeholder="@username" /></div>
        <div style={S.formGroup}><label style={S.formLabel}>Facebook</label><input style={S.input} value={form.facebook || ""} onChange={(e) => set("facebook", e.target.value)} placeholder="Profile URL or name" /></div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>{isMarketing ? "Role" : "Subject / Role"}</label>
          <input
            style={S.input}
            list={isMarketing ? "marketing-roles-list" : undefined}
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder={isMarketing ? "e.g. Graphic Designer" : "e.g. English, Admin"}
          />
          {isMarketing && (
            <datalist id="marketing-roles-list">
              <option value="Graphic Designer" />
              <option value="Video Editor" />
            </datalist>
          )}
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Monthly Salary (MMK)</label>
          <input style={S.input} type="number" min={0} value={form.monthlySalary || 0} onChange={(e) => set("monthlySalary", parseInt(e.target.value) || 0)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Salary Pay Day (1–31)</label>
          <input style={S.input} type="number" min={1} max={31} value={form.salaryPayDay || 1} onChange={(e) => set("salaryPayDay", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))} />
          <div style={{ fontSize: 11, color: BRAND.grey, marginTop: 4 }}>Day of month salary is due</div>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Status</label>
          <select style={S.select} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div style={S.formGroup}><label style={S.formLabel}>Join Date</label><input style={S.input} type="date" value={fmtDateInput(form.joinDate)} onChange={(e) => set("joinDate", e.target.value)} /></div>
      </div>
      <div style={S.formGroup}><label style={S.formLabel}>Notes</label><textarea style={{ ...S.input, height: 60, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
        <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : teacher ? `Save ${isMarketing ? "Staff Member" : "Teacher"}` : `Add ${isMarketing ? "Staff Member" : "Teacher"}`}
        </button>
      </div>
    </Modal>
  );
}

function SalaryHistoryModal({ teacher, salaries, onMarkPaid, onAdd, onDelete, onClose }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    monthKey: currentMonthKey(),
    amount: teacher.monthlySalary || 0,
    markAsPaid: false,
    paidDate: today(),
  });
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setAddForm((p) => ({ ...p, [k]: v }));

  const sorted = [...salaries].sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  async function handleMarkPaid(record) {
    try { await onMarkPaid(teacher.id, today(), record); } catch (err) { alert(err.message); }
  }

  async function handleAdd() {
    if (!addForm.monthKey) { alert("Month is required"); return; }
    setSaving(true);
    try {
      const created = await onAdd({
        teacherId: teacher.id,
        teacherName: teacher.name,
        monthKey: addForm.monthKey,
        hoursWorked: 1,
        hourlyRate: addForm.amount,
        dueDate: `${addForm.monthKey}-${String(teacher.salaryPayDay || 1).padStart(2, "0")}`,
        notes: "",
      });
      if (addForm.markAsPaid) {
        await onMarkPaid(teacher.id, addForm.paidDate, created);
      }
      setShowAddForm(false);
      setAddForm({ monthKey: currentMonthKey(), amount: teacher.monthlySalary || 0, markAsPaid: false, paidDate: today() });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this salary record?")) return;
    try { await onDelete(id); } catch (err) { alert(err.message); }
  }

  return (
    <Modal title={`Salary History — ${teacher.name}`} onClose={onClose}>
      <div style={{ ...S.flexBetween, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: BRAND.grey }}>
          Monthly salary: <strong style={{ color: BRAND.navy }}>{fmtMMK(teacher.monthlySalary || 0)}</strong>
          {teacher.salaryPayDay && <span style={{ color: BRAND.grey }}> · due {teacher.salaryPayDay}{nth(teacher.salaryPayDay)} of month</span>}
        </div>
        <button style={S.btn(showAddForm ? "secondary" : "primary")} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "+ Add Record"}
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: BRAND.surface, borderRadius: 8, padding: 16, marginBottom: 16, border: `1px solid ${BRAND.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={S.formGroup}>
              <label style={S.formLabel}>Month</label>
              <input style={S.input} type="month" value={addForm.monthKey} onChange={(e) => setF("monthKey", e.target.value)} />
            </div>
            <div style={S.formGroup}>
              <label style={S.formLabel}>Amount (MMK)</label>
              <input style={S.input} type="number" value={addForm.amount} onChange={(e) => setF("amount", parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={addForm.markAsPaid} onChange={(e) => setF("markAsPaid", e.target.checked)} />
              Mark as paid
            </label>
            {addForm.markAsPaid && (
              <input style={{ ...S.input, width: 160, fontSize: 13 }} type="date" value={addForm.paidDate} onChange={(e) => setF("paidDate", e.target.value)} />
            )}
          </div>
          <button style={S.btn("primary")} onClick={handleAdd} disabled={saving}>
            {saving ? "Saving…" : "Save Record"}
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: BRAND.grey, fontSize: 13 }}>No salary records yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Month</th>
                <th style={S.th}>Amount</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Paid Date</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} onMouseEnter={(e) => e.currentTarget.style.background = BRAND.surface} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 600 }}>{s.monthKey}</td>
                  <td style={S.td}><strong style={{ color: BRAND.navy }}>{fmtMMK(s.totalAmount)}</strong></td>
                  <td style={S.td}><Badge stage={s.status} /></td>
                  <td style={S.td}>{s.paidDate ? fmtDate(s.paidDate) : "—"}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.status === "Unpaid" && (
                        <button style={{ ...S.btn("success"), padding: "4px 10px", fontSize: 12 }} onClick={() => handleMarkPaid(s)}>✓ Pay</button>
                      )}
                      <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => handleDelete(s.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

function AdsSpendForm({ expense, onSave, onClose }) {
  const [form, setForm] = useState(expense || {
    date: today(),
    platform: "Facebook Ads",
    description: "",
    amount: 0,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!form.description.trim()) { alert("Campaign / description is required"); return; }
    if (!form.amount || form.amount <= 0) { alert("Amount must be greater than 0"); return; }
    setSaving(true);
    try { await onSave(form); } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={expense ? "Edit Ad Spend" : "Add Ad Spend"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Date</label>
          <input style={S.input} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Platform</label>
          <select style={S.select} value={form.platform} onChange={(e) => set("platform", e.target.value)}>
            {ADS_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ ...S.formGroup, gridColumn: "span 2" }}>
          <label style={S.formLabel}>Campaign / Description *</label>
          <input style={S.input} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. April Enrollment Drive" />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Amount (MMK)</label>
          <input style={S.input} type="number" min={0} value={form.amount} onChange={(e) => set("amount", parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <div style={S.formGroup}>
        <label style={S.formLabel}>Notes</label>
        <textarea style={{ ...S.input, height: 56, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
        <button style={S.btn("primary")} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : expense ? "Save" : "Add Spend"}
        </button>
      </div>
    </Modal>
  );
}

// ─── MARKETING ───────────────────────────────────────────────────
function MarketingPage({ teachers, teacherSalaries, expenses = [], onSaveTeacher, onDeleteTeacher, onMarkSalaryPaid, onAddSalaryRecord, onDeleteSalaryRecord, onSaveExpense, onDeleteExpense }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyMember, setHistoryMember] = useState(null);
  const [showAddAd, setShowAddAd] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [adsMonthFilter, setAdsMonthFilter] = useState(currentMonthKey());

  const marketingStaff = teachers.filter((t) => t.department === "Marketing");
  const filtered = marketingStaff.filter((t) =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.nameBurmese && t.nameBurmese.toLowerCase().includes(search.toLowerCase()))
  );

  const activeStaff = marketingStaff.filter((t) => t.status === "Active");
  const mk = currentMonthKey();
  const totalBudget = activeStaff.reduce((s, t) => s + (t.monthlySalary || 0), 0);
  const marketingIds = new Set(activeStaff.map((t) => t.id));
  const paidThisMonth = teacherSalaries
    .filter((s) => marketingIds.has(s.teacherId) && s.monthKey === mk && s.status === "Paid")
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingThisMonth = activeStaff.reduce((sum, t) => {
    const { status } = getSalaryStatus(t, teacherSalaries);
    return status !== "paid" ? sum + (t.monthlySalary || 0) : sum;
  }, 0);

  // Ads spend
  const allAds = expenses.filter((e) => e.category === "Marketing");
  const thisMonthAds = allAds.filter((e) => e.monthKey === mk).reduce((sum, e) => sum + e.amount, 0);
  const totalAdsAllTime = allAds.reduce((sum, e) => sum + e.amount, 0);
  const adsFiltered = [...allAds]
    .filter((e) => !adsMonthFilter || e.monthKey === adsMonthFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Unique months with ad records for the filter dropdown
  const adsMonths = [...new Set(allAds.map((e) => e.monthKey))].sort((a, b) => b.localeCompare(a));

  async function deleteMember(id) {
    if (!confirm("Delete this staff member?")) return;
    try { await onDeleteTeacher(id); } catch (err) { alert(err.message); }
  }

  async function markPaid(member) {
    try { await onMarkSalaryPaid(member.id); } catch (err) { alert(err.message); }
  }

  async function deleteAd(id) {
    if (!confirm("Delete this ad spend record?")) return;
    try { await onDeleteExpense(id); } catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div style={S.pageTitle}>Marketing</div>
      <div style={S.pageDesc}>Track graphic designers, video editors, and marketing staff pay</div>

      <div style={S.statsRow}>
        <div style={S.statCard(BRAND.red)}>
          <div style={S.statNum}>{activeStaff.length}</div>
          <div style={S.statLabel}>Active Marketing Staff</div>
        </div>
        <div style={S.statCard(BRAND.navy)}>
          <div style={S.statNum}>{fmtMMK(totalBudget)}</div>
          <div style={S.statLabel}>Monthly Marketing Budget</div>
        </div>
        <div style={S.statCard(BRAND.green)}>
          <div style={S.statNum}>{fmtMMK(paidThisMonth)}</div>
          <div style={S.statLabel}>Paid This Month</div>
        </div>
        <div style={S.statCard(BRAND.orange)}>
          <div style={S.statNum}>{fmtMMK(pendingThisMonth)}</div>
          <div style={S.statLabel}>Staff Pending</div>
        </div>
        <div style={S.statCard(BRAND.red)}>
          <div style={{ ...S.statNum, color: BRAND.red }}>{fmtMMK(thisMonthAds)}</div>
          <div style={S.statLabel}>Ads Spend This Month</div>
        </div>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>{ICONS.search}</span>
          <input style={S.searchInput} placeholder="Search marketing staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button style={S.btn("primary")} onClick={() => setShowAdd(true)}>{ICONS.add} Add Staff Member</button>
      </div>

      <div style={S.card}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="📢"
            message="No marketing staff yet"
            action={<button style={S.btn("primary")} onClick={() => setShowAdd(true)}>Add First Staff Member</button>}
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Contact</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Monthly Salary</th>
                  <th style={S.th}>Pay Day</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>This Month</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const { status: salStatus, record } = getSalaryStatus(t, teacherSalaries);
                  const ss = SALARY_STATUS_STYLE[salStatus];
                  return (
                    <tr key={t.id} onMouseEnter={(e) => e.currentTarget.style.background = BRAND.surface} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        {t.nameBurmese && <div style={{ fontSize: 12, color: BRAND.navy }}>{t.nameBurmese}</div>}
                        {t.email && <div style={{ fontSize: 11, color: BRAND.grey }}>{t.email}</div>}
                      </td>
                      <td style={S.td}>
                        {t.phone && <div style={{ fontSize: 12 }}>📞 {t.phone}</div>}
                        {t.telegram && <div style={{ fontSize: 12, color: BRAND.navyMid }}>✈️ {t.telegram}</div>}
                        {t.facebook && <div style={{ fontSize: 11, color: BRAND.grey }}>fb: {t.facebook}</div>}
                      </td>
                      <td style={S.td}>
                        <span style={S.tag}>{t.subject || "—"}</span>
                      </td>
                      <td style={S.td}>
                        <strong style={{ color: BRAND.navy, fontFamily: "'Montserrat', sans-serif" }}>{fmtMMK(t.monthlySalary || 0)}</strong>
                      </td>
                      <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                        {t.salaryPayDay ? `${t.salaryPayDay}${nth(t.salaryPayDay)} of month` : "—"}
                      </td>
                      <td style={S.td}><Badge stage={t.status} /></td>
                      <td style={S.td}>
                        <span style={S.badge(ss.color, ss.bg)}>{ss.label}</span>
                        {record?.paidDate && (
                          <div style={{ fontSize: 10, color: BRAND.grey, marginTop: 3 }}>
                            Paid {fmtDate(record.paidDate)}
                          </div>
                        )}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {salStatus !== "paid" && t.status === "Active" && (
                            <button style={{ ...S.btn("success"), padding: "4px 10px", fontSize: 12 }} onClick={() => markPaid(t)}>
                              ✓ Pay
                            </button>
                          )}
                          <button style={S.btn("small")} onClick={() => setHistoryMember(t)}>History</button>
                          <button style={S.btn("small")} onClick={() => setEditing(t)}>Edit</button>
                          <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => deleteMember(t.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <TeacherForm
          teacher={editing}
          department="Marketing"
          onSave={async (d) => { await onSaveTeacher(d); setShowAdd(false); setEditing(null); }}
          onClose={() => { setShowAdd(false); setEditing(null); }}
        />
      )}

      {historyMember && (
        <SalaryHistoryModal
          teacher={historyMember}
          salaries={teacherSalaries.filter((s) => s.teacherId === historyMember.id)}
          onMarkPaid={onMarkSalaryPaid}
          onAdd={onAddSalaryRecord}
          onDelete={onDeleteSalaryRecord}
          onClose={() => setHistoryMember(null)}
        />
      )}

      {/* ── Ads Spend ── */}
      <div style={S.card}>
        <div style={{ ...S.flexBetween, marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ ...S.cardTitle, marginBottom: 2 }}>📣 Ads Spend</div>
            <div style={{ fontSize: 13, color: BRAND.grey }}>
              All-time total: <strong style={{ color: BRAND.navy }}>{fmtMMK(totalAdsAllTime)}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select
              style={{ ...S.select, width: "auto", minWidth: 140, fontSize: 13 }}
              value={adsMonthFilter}
              onChange={(e) => setAdsMonthFilter(e.target.value)}
            >
              <option value="">All time</option>
              {adsMonths.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button style={S.btn("primary")} onClick={() => setShowAddAd(true)}>{ICONS.add} Add Spend</button>
          </div>
        </div>

        {adsFiltered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: BRAND.grey, fontSize: 13 }}>
            No ad spend recorded{adsMonthFilter ? ` for ${adsMonthFilter}` : " yet"}.
          </div>
        ) : (
          <>
            <div style={{ ...S.flexBetween, marginBottom: 12, padding: "10px 14px", background: BRAND.blueLight, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: BRAND.navy }}>
                {adsFiltered.length} record{adsFiltered.length !== 1 ? "s" : ""}{adsMonthFilter ? ` in ${adsMonthFilter}` : ""}
              </span>
              <strong style={{ color: BRAND.red, fontFamily: "'Montserrat', sans-serif" }}>
                {fmtMMK(adsFiltered.reduce((s, e) => s + e.amount, 0))} total
              </strong>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Platform</th>
                    <th style={S.th}>Campaign / Description</th>
                    <th style={S.th}>Amount</th>
                    <th style={S.th}>Notes</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {adsFiltered.map((e) => (
                    <tr key={e.id} onMouseEnter={(ev) => ev.currentTarget.style.background = BRAND.surface} onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}>
                      <td style={{ ...S.td, whiteSpace: "nowrap" }}>{fmtDate(e.date)}</td>
                      <td style={S.td}>{e.platform ? <span style={S.tag}>{e.platform}</span> : <span style={{ color: BRAND.grey }}>—</span>}</td>
                      <td style={S.td}>{e.description}</td>
                      <td style={S.td}><strong style={{ color: BRAND.red }}>{fmtMMK(e.amount)}</strong></td>
                      <td style={{ ...S.td, fontSize: 12, color: BRAND.grey }}>{e.notes || "—"}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={S.btn("small")} onClick={() => setEditingAd(e)}>Edit</button>
                          <button style={{ ...S.btn("small"), color: BRAND.errorRed }} onClick={() => deleteAd(e.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {(showAddAd || editingAd) && (
        <AdsSpendForm
          expense={editingAd}
          onSave={async (d) => { await onSaveExpense({ ...d, category: "Marketing" }); setShowAddAd(false); setEditingAd(null); }}
          onClose={() => { setShowAddAd(false); setEditingAd(null); }}
        />
      )}
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────
function SettingsPage({ data, onSaveSettings, onImportData, onResetData }) {
  const [settings, setSettings] = useState(data.settings || {});
  const set = (k, v) => setSettings((p) => ({ ...p, [k]: v }));

  async function save() {
    try {
      await onSaveSettings(settings);
      alert("Settings saved.");
    } catch (err) {
      alert(err.message);
    }
  }

  function exportData() {
    const exportObj = {
      students: data.students,
      batches: data.batches,
      invoices: data.invoices,
      leads: data.leads,
      settings: data.settings,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `speakup-sms-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.students && imported.batches && imported.invoices && imported.leads) {
          await onImportData(imported);
          alert("Data imported successfully.");
        } else {
          alert("Invalid backup file.");
        }
      } catch {
        alert("Failed to parse file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function resetAll() {
    if (!confirm("Reset ALL data? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;
    try {
      await onResetData();
      alert("All data has been reset.");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div style={S.pageTitle}>Settings</div>
      <div style={S.pageDesc}>Configure invoicing, data management, and preferences</div>

      <div style={S.card}>
        <div style={S.cardTitle}>{ICONS.money} Invoice Settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={S.formGroup}><label style={S.formLabel}>Invoice Prefix</label><input style={S.input} value={settings.invoicePrefix || ""} onChange={(e) => set("invoicePrefix", e.target.value)} /></div>
          <div style={S.formGroup}><label style={S.formLabel}>Next Invoice Number</label><input style={S.input} type="number" value={settings.nextInvoiceNum || 1001} onChange={(e) => set("nextInvoiceNum", parseInt(e.target.value) || 1001)} /></div>
          <div style={S.formGroup}><label style={S.formLabel}>Default Monthly Fee (MMK)</label><input style={S.input} type="number" value={settings.defaultFee || 0} onChange={(e) => set("defaultFee", parseInt(e.target.value) || 0)} /></div>
          <div style={S.formGroup}><label style={S.formLabel}>Currency</label><input style={S.input} value={settings.currency || "MMK"} onChange={(e) => set("currency", e.target.value)} /></div>
        </div>
        <button style={S.btn("primary")} onClick={save}>Save Settings</button>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>💾 Data Management</div>
        <p style={{ fontSize: 13, color: BRAND.grey, marginBottom: 16 }}>Export your data for backup or import from a previous backup.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button style={S.btn("secondary")} onClick={exportData}>{ICONS.download} Export Backup (JSON)</button>
          <label style={{ ...S.btn("secondary"), cursor: "pointer" }}>
            📂 Import Backup
            <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
          </label>
          <button style={S.btn("danger")} onClick={resetAll}>Reset All Data</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📊 Quick Stats</div>
        <div style={{ fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>Total Students: <strong>{data.students.length}</strong></div>
          <div>Active Students: <strong>{data.students.filter((s) => s.status === "Active").length}</strong></div>
          <div>Total Batches: <strong>{data.batches.length}</strong></div>
          <div>Total Invoices: <strong>{data.invoices.length}</strong></div>
          <div>Total CRM Leads: <strong>{data.leads.length}</strong></div>
          <div>Lifetime Revenue: <strong>{fmtMMK(data.invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amountPaid, 0))}</strong></div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function TitanSMS() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [data, setData] = useState({ students: [], batches: [], invoices: [], leads: [], settings: {}, paymentHistory: [], teachers: [], teacherSalaries: [], expenses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        await api.markInvoicesOverdue();
        const [students, batches, invoices, leads, settings, paymentHistory, teachers, teacherSalaries, expenses] = await Promise.all([
          api.getStudents(),
          api.getBatches(),
          api.getInvoices(),
          api.getLeads(),
          api.getSettings(),
          api.getPaymentHistory(),
          api.getTeachers(),
          api.getTeacherSalaries(),
          api.getExpenses(),
        ]);
        setData({ students, batches, invoices, leads, settings, paymentHistory, teachers, teacherSalaries, expenses });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Student handlers ──
  async function handleSaveStudent(studentData) {
    if (studentData.id) {
      const updated = await api.updateStudent(studentData.id, studentData);
      setData((prev) => ({ ...prev, students: prev.students.map((s) => s.id === studentData.id ? updated : s) }));
      return updated;
    } else {
      const created = await api.createStudent(studentData);
      setData((prev) => ({ ...prev, students: [...prev.students, created] }));
      return created;
    }
  }

  async function handleDeleteStudent(id) {
    await api.deleteStudent(id);
    setData((prev) => ({ ...prev, students: prev.students.filter((s) => s.id !== id) }));
  }

  async function handleAddStrike(id) {
    const updated = await api.addStrike(id);
    setData((prev) => ({ ...prev, students: prev.students.map((s) => s.id === id ? updated : s) }));
  }

  async function handleRemoveStrike(id) {
    const updated = await api.removeStrike(id);
    setData((prev) => ({ ...prev, students: prev.students.map((s) => s.id === id ? updated : s) }));
  }

  // ── Batch handlers ──
  async function handleSaveBatch(batchData) {
    if (batchData.id) {
      const updated = await api.updateBatch(batchData.id, batchData);
      setData((prev) => ({ ...prev, batches: prev.batches.map((b) => b.id === batchData.id ? updated : b) }));
    } else {
      const created = await api.createBatch(batchData);
      setData((prev) => ({ ...prev, batches: [...prev.batches, created] }));
    }
  }

  async function handleDeleteBatch(id) {
    await api.deleteBatch(id);
    setData((prev) => ({ ...prev, batches: prev.batches.filter((b) => b.id !== id) }));
  }

  // ── Invoice handlers ──
  async function handleMarkPaid(id) {
    const result = await api.markInvoicePaid(id);
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
      paymentHistory: result.history ? [result.history, ...prev.paymentHistory] : prev.paymentHistory,
    }));
  }

  async function handleDeleteInvoice(id) {
    await api.deleteInvoice(id);
    setData((prev) => ({ ...prev, invoices: prev.invoices.filter((i) => i.id !== id) }));
  }

  async function handleGenerateInvoices() {
    const result = await api.generateMonthlyInvoices();
    setData((prev) => ({ ...prev, invoices: [...prev.invoices, ...result.invoices] }));
    return result.count;
  }

  async function handleDeletePaymentHistory(id) {
    const result = await api.deletePaymentHistory(id);
    setData((prev) => ({
      ...prev,
      paymentHistory: prev.paymentHistory.filter((ph) => ph.id !== id),
      invoices: result.deletedInvoiceId
        ? prev.invoices.filter((i) => i.id !== result.deletedInvoiceId)
        : prev.invoices,
    }));
  }

  // ── Lead handlers ──
  async function handleSaveLead(leadData) {
    if (leadData.id) {
      const updated = await api.updateLead(leadData.id, leadData);
      setData((prev) => ({ ...prev, leads: prev.leads.map((l) => l.id === leadData.id ? updated : l) }));
    } else {
      const created = await api.createLead(leadData);
      setData((prev) => ({ ...prev, leads: [...prev.leads, created] }));
    }
  }

  async function handleDeleteLead(id) {
    await api.deleteLead(id);
    setData((prev) => ({ ...prev, leads: prev.leads.filter((l) => l.id !== id) }));
  }

  async function handleMoveStage(id, newStage) {
    const lead = data.leads.find((l) => l.id === id);
    const updated = await api.updateLead(id, { ...lead, stage: newStage });
    setData((prev) => ({ ...prev, leads: prev.leads.map((l) => l.id === id ? updated : l) }));
  }

  async function handleConvertToStudent(leadId) {
    const result = await api.convertLeadToStudent(leadId);
    setData((prev) => ({
      ...prev,
      students: [...prev.students, result.student],
      leads: prev.leads.map((l) => l.id === leadId ? result.lead : l),
    }));
  }

  // ── Settings handlers ──
  async function handleSaveSettings(settings) {
    const updated = await api.updateSettings(settings);
    setData((prev) => ({ ...prev, settings: updated }));
  }

  async function handleImportData(importedData) {
    const result = await api.importData(importedData);
    setData(result);
  }

  async function handleResetData() {
    const result = await api.resetData();
    setData(result);
  }

  // ── Teacher handlers ──
  async function handleSaveTeacher(teacherData) {
    if (teacherData.id) {
      const updated = await api.updateTeacher(teacherData.id, teacherData);
      setData((prev) => ({ ...prev, teachers: prev.teachers.map((t) => t.id === teacherData.id ? updated : t) }));
    } else {
      const created = await api.createTeacher(teacherData);
      setData((prev) => ({ ...prev, teachers: [...prev.teachers, created] }));
    }
  }

  async function handleDeleteTeacher(id) {
    await api.deleteTeacher(id);
    setData((prev) => ({ ...prev, teachers: prev.teachers.filter((t) => t.id !== id) }));
  }

  // Marks current-month salary as paid, creating a record first if none exists.
  // Can also be called with (teacherId, paidDate, existingRecord) to mark a specific record.
  async function handleMarkSalaryPaid(teacherId, paidDate, existingRecord) {
    const pd = paidDate || today();
    let record = existingRecord || null;

    if (!record) {
      const mk = currentMonthKey();
      record = data.teacherSalaries.find((s) => s.teacherId === teacherId && s.monthKey === mk) || null;
      if (!record) {
        const teacher = data.teachers.find((t) => t.id === teacherId);
        record = await api.createTeacherSalary({
          teacherId,
          teacherName: teacher.name,
          monthKey: mk,
          hoursWorked: 1,
          hourlyRate: teacher.monthlySalary || 0,
          dueDate: `${mk}-${String(teacher.salaryPayDay || 1).padStart(2, "0")}`,
          notes: "",
        });
      }
    }

    const updated = await api.markTeacherSalaryPaid(record.id, pd);
    setData((prev) => {
      const exists = prev.teacherSalaries.some((s) => s.id === updated.id);
      return {
        ...prev,
        teacherSalaries: exists
          ? prev.teacherSalaries.map((s) => (s.id === updated.id ? updated : s))
          : [...prev.teacherSalaries, updated],
      };
    });
  }

  async function handleAddSalaryRecord(recordData) {
    const created = await api.createTeacherSalary(recordData);
    setData((prev) => ({ ...prev, teacherSalaries: [...prev.teacherSalaries, created] }));
    return created;
  }

  async function handleDeleteSalaryRecord(id) {
    await api.deleteTeacherSalary(id);
    setData((prev) => ({ ...prev, teacherSalaries: prev.teacherSalaries.filter((s) => s.id !== id) }));
  }

  // ── Expense handlers ──
  async function handleSaveExpense(expenseData) {
    if (expenseData.id) {
      const updated = await api.updateExpense(expenseData.id, expenseData);
      setData((prev) => ({ ...prev, expenses: prev.expenses.map((e) => e.id === expenseData.id ? updated : e) }));
    } else {
      const created = await api.createExpense(expenseData);
      setData((prev) => ({ ...prev, expenses: [...prev.expenses, created] }));
    }
  }

  async function handleDeleteExpense(id) {
    await api.deleteExpense(id);
    setData((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "'Montserrat', sans-serif", fontSize: 18, color: BRAND.navy }}>
        Loading SpeakUp English…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "'Inter', sans-serif", gap: 12 }}>
        <div style={{ fontSize: 24, color: BRAND.errorRed }}>Could not connect to server</div>
        <div style={{ fontSize: 14, color: BRAND.grey }}>{error}</div>
        <div style={{ fontSize: 13, color: BRAND.grey }}>Make sure the Express server is running on port 5000 and MongoDB is connected.</div>
      </div>
    );
  }

  const pages = {
    Dashboard: <Dashboard data={data} />,
    Students: (
      <StudentsPage
        students={data.students}
        batches={data.batches}
        onSaveStudent={handleSaveStudent}
        onDeleteStudent={handleDeleteStudent}
        onAddStrike={handleAddStrike}
        onRemoveStrike={handleRemoveStrike}
      />
    ),
    Batches: (
      <BatchesPage
        batches={data.batches}
        students={data.students}
        onSaveBatch={handleSaveBatch}
        onDeleteBatch={handleDeleteBatch}
      />
    ),
    Invoices: (
      <InvoicesPage
        invoices={data.invoices}
        students={data.students}
        batches={data.batches}
        settings={data.settings}
        onMarkPaid={handleMarkPaid}
        onDeleteInvoice={handleDeleteInvoice}
        onGenerateInvoices={handleGenerateInvoices}
      />
    ),
    "Payment History": (
      <PaymentHistoryPage
        paymentHistory={data.paymentHistory}
        batches={data.batches}
        onDelete={handleDeletePaymentHistory}
      />
    ),
    CRM: (
      <CRMPage
        leads={data.leads}
        batches={data.batches}
        onSaveLead={handleSaveLead}
        onDeleteLead={handleDeleteLead}
        onMoveStage={handleMoveStage}
        onConvertToStudent={handleConvertToStudent}
      />
    ),
    Teachers: (
      <TeachersPage
        teachers={data.teachers}
        teacherSalaries={data.teacherSalaries}
        onSaveTeacher={handleSaveTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onMarkSalaryPaid={handleMarkSalaryPaid}
        onAddSalaryRecord={handleAddSalaryRecord}
        onDeleteSalaryRecord={handleDeleteSalaryRecord}
      />
    ),
    Marketing: (
      <MarketingPage
        teachers={data.teachers}
        teacherSalaries={data.teacherSalaries}
        expenses={data.expenses}
        onSaveTeacher={handleSaveTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onMarkSalaryPaid={handleMarkSalaryPaid}
        onAddSalaryRecord={handleAddSalaryRecord}
        onDeleteSalaryRecord={handleDeleteSalaryRecord}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
      />
    ),
    Settings: (
      <SettingsPage
        data={data}
        onSaveSettings={handleSaveSettings}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    ),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Caveat:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.border}; border-radius: 3px; }
        button:hover { opacity: 0.88; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${BRAND.red}; box-shadow: 0 0 0 2px ${BRAND.red}33; }
        tr { transition: background 0.15s; }
      `}</style>
      <div style={S.app}>
        <nav style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={S.sidebarLogo}>
              Speak<span style={S.sidebarLogoAccent}>Up</span>
            </div>
            <div style={S.sidebarSub}>English School</div>
          </div>
          <div style={{ flex: 1, paddingTop: 12 }}>
            {TABS.map((tab) => (
              <div key={tab} style={S.navItem(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                <span>{ICONS[tab]}</span>
                <span>{tab}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${BRAND.navyMid}`, fontSize: 11, color: BRAND.navyMuted }}>
            Speak your future. Fluency starts here.
          </div>
        </nav>
        <main style={S.main}>
          {pages[activeTab]}
        </main>
      </div>
    </>
  );
}
