const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameBurmese: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    telegram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    subject: { type: String, default: "English" },
    monthlySalary: { type: Number, default: 0 },
    salaryPayDay: { type: Number, default: 1, min: 1, max: 31 },
    department: { type: String, enum: ["Teaching", "Marketing"], default: "Teaching" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    joinDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
    notes: { type: String, default: "" },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model("Teacher", teacherSchema);
