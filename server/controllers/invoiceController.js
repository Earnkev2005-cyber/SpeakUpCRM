const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const Settings = require("../models/Settings");
const PaymentHistory = require("../models/PaymentHistory");

const today = () => new Date().toISOString().split("T")[0];
const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Add exactly one calendar month, clamping to the last valid day if needed.
// e.g. Jan 31 → Feb 28, not Mar 3.
function addOneMonth(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastDay = new Date(nextYear, nextMonth, 0).getDate();
  const d = Math.min(day, lastDay);
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fmtShortDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

exports.getInvoices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.monthKey) filter.monthKey = req.query.monthKey;
    const invoices = await Invoice.find(filter).sort({ issueDate: -1 });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    next(err);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Allow client to pass a test date (e.g. during development testing)
    const paidDate = req.body.testDate || today();
    const student = await Student.findById(invoice.studentId).catch(() => null);

    const priorCount = await PaymentHistory.countDocuments({ studentId: invoice.studentId });

    const history = await PaymentHistory.create({
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      studentEmail: invoice.studentEmail,
      nameBurmese: student ? (student.nameBurmese || "") : "",
      batchId: invoice.batchId,
      batchName: invoice.batchName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      paidDate,
      periodStart: invoice.periodStart || "",
      periodEnd: invoice.periodEnd || "",
      paymentCount: priorCount + 1,
      notes: invoice.notes || "",
    });

    // Delete the paid invoice — it now lives in PaymentHistory.
    // The next invoice is created explicitly via "Generate Monthly Invoices".
    await Invoice.findByIdAndDelete(req.params.id);

    res.json({ history, deletedInvoiceId: req.params.id });
  } catch (err) {
    next(err);
  }
};

exports.generateMonthly = async (req, res, next) => {
  try {
    const todayStr = req.body.testDate || today();
    const activeStudents = await Student.find({ status: "Active" });
    const settings = await Settings.findOne();
    const batches = await Batch.find();
    const batchMap = Object.fromEntries(batches.map((b) => [b.id, b]));

    // Current unpaid/overdue invoices per student
    const allInvoices = await Invoice.find({
      studentId: { $in: activeStudents.map((s) => s.id) },
    });
    const invoicesByStudent = {};
    for (const inv of allInvoices) {
      if (!invoicesByStudent[inv.studentId]) invoicesByStudent[inv.studentId] = [];
      invoicesByStudent[inv.studentId].push(inv);
    }

    // Last payment date per student — paid invoices are now in PaymentHistory
    const allHistory = await PaymentHistory.find({
      studentId: { $in: activeStudents.map((s) => s.id) },
    }).sort({ paidDate: -1 });
    const lastPaymentByStudent = {};
    for (const ph of allHistory) {
      if (!lastPaymentByStudent[ph.studentId]) lastPaymentByStudent[ph.studentId] = ph;
    }

    const toGenerate = [];
    let examSkipped = 0;

    for (const s of activeStudents) {
      const studentInvoices = invoicesByStudent[s.id] || [];

      // Skip: student already has any unpaid/overdue invoice
      if (studentInvoices.some((i) => i.status === "Unpaid" || i.status === "Overdue")) continue;

      // Starting point: end of the last paid period (honours enrollment-date billing cycle),
      // falling back to paidDate for legacy records without periodEnd, then enrolledDate for new students.
      const lastPayment = lastPaymentByStudent[s.id];
      let periodStart = lastPayment
        ? (lastPayment.periodEnd || lastPayment.paidDate)
        : (s.enrolledDate || todayStr);

      const batch = batchMap[s.batchId];

      // Walk forward month-by-month, generating every overdue period up to today
      while (periodStart < todayStr) {
        if (batch && batch.examDate && periodStart.slice(0, 7) > batch.examDate.slice(0, 7)) {
          examSkipped++;
          break;
        }
        const periodEnd = addOneMonth(periodStart);
        toGenerate.push({ student: s, periodStart, periodEnd });
        periodStart = periodEnd; // next iteration begins where this period ended
      }
    }

    if (toGenerate.length === 0) {
      const msg =
        examSkipped > 0
          ? `No invoices to generate. ${examSkipped} student(s) excluded — exam period has ended.`
          : "No invoices to generate. All active students have unpaid invoices or are fully up to date.";
      return res.status(400).json({ message: msg });
    }

    let nextNum = settings.nextInvoiceNum;

    const newInvoices = toGenerate.map(({ student: s, periodStart, periodEnd }) => {
      const batch = batchMap[s.batchId];
      const fee = s.customFee != null ? s.customFee : (batch ? batch.fee : settings.defaultFee);
      const periodLabel = `${fmtShortDate(periodStart)} – ${fmtShortDate(periodEnd)}`;
      return {
        invoiceNumber: `${settings.invoicePrefix}-${nextNum++}`,
        studentId: s.id,
        studentName: s.name,
        studentEmail: s.email,
        batchId: s.batchId,
        batchName: batch ? batch.name : "—",
        monthKey: periodStart.slice(0, 7),
        periodStart,
        periodEnd,
        issueDate: todayStr,
        dueDate: periodEnd,
        amount: fee,
        amountPaid: 0,
        status: "Unpaid",
        paidDate: null,
        items: [{ desc: `${batch ? batch.name : "Tuition"} · ${periodLabel}`, qty: 1, rate: fee }],
        notes: "",
      };
    });

    const created = await Invoice.insertMany(newInvoices);
    settings.nextInvoiceNum = nextNum;
    await settings.save();

    res.status(201).json({ count: created.length, invoices: created, examSkipped });
  } catch (err) {
    next(err);
  }
};

exports.markOverdue = async (req, res, next) => {
  try {
    const todayStr = today();
    const result = await Invoice.updateMany(
      { status: "Unpaid", dueDate: { $lt: todayStr } },
      { $set: { status: "Overdue" } }
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};
