const mongoose = require("mongoose");

const teacherSalarySchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    monthKey: { type: String, required: true }, // "YYYY-MM"
    hoursWorked: { type: Number, default: 0 },
    hourlyRate: { type: Number, required: true },
    totalAmount: { type: Number, required: true }, // hoursWorked * hourlyRate
    status: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    paidDate: { type: String, default: null },
    dueDate: { type: String, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model("TeacherSalary", teacherSalarySchema);
