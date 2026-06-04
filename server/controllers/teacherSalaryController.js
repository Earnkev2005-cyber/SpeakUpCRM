const TeacherSalary = require("../models/TeacherSalary");

exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.monthKey) filter.monthKey = req.query.monthKey;
    if (req.query.teacherId) filter.teacherId = req.query.teacherId;
    const records = await TeacherSalary.find(filter).sort({ monthKey: -1, teacherName: 1 });
    res.json(records);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { teacherId, teacherName, monthKey, hoursWorked, hourlyRate, dueDate, notes } = req.body;
    const totalAmount = (hoursWorked || 0) * (hourlyRate || 0);
    const record = await TeacherSalary.create({
      teacherId, teacherName, monthKey, hoursWorked, hourlyRate, totalAmount, dueDate, notes,
    });
    res.status(201).json(record);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { hoursWorked, hourlyRate } = req.body;
    if (hoursWorked != null && hourlyRate != null) {
      req.body.totalAmount = hoursWorked * hourlyRate;
    }
    const record = await TeacherSalary.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (err) { next(err); }
};

exports.markPaid = async (req, res, next) => {
  try {
    const paidDate = req.body.paidDate || new Date().toISOString().split("T")[0];
    const record = await TeacherSalary.findByIdAndUpdate(
      req.params.id,
      { status: "Paid", paidDate },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const record = await TeacherSalary.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
};
