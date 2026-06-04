const PaymentHistory = require("../models/PaymentHistory");
const Invoice = require("../models/Invoice");

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.batchId) filter.batchId = req.query.batchId;
    const history = await PaymentHistory.find(filter).sort({ paidDate: -1 });
    res.json(history);
  } catch (err) {
    next(err);
  }
};

exports.deletePaymentHistory = async (req, res, next) => {
  try {
    const record = await PaymentHistory.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Payment record not found" });

    // Remove the next invoice that was auto-generated when this payment was recorded
    const deleted = await Invoice.findOneAndDelete({
      studentId: record.studentId,
      issueDate: record.paidDate,
    });

    res.json({ deleted: record, deletedInvoiceId: deleted ? deleted.id : null });
  } catch (err) {
    next(err);
  }
};
