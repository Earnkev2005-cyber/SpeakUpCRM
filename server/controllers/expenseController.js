const Expense = require("../models/Expense");

exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.monthKey) filter.monthKey = req.query.monthKey;
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { category, description, amount, date, notes } = req.body;
    const monthKey = date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const expense = await Expense.create({ category, description, amount, date, monthKey, notes });
    res.status(201).json(expense);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.body.date) req.body.monthKey = req.body.date.slice(0, 7);
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
};
