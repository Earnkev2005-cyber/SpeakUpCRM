const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Rent", "Utilities", "Materials", "Marketing", "Equipment", "Other"],
      default: "Other",
    },
    description: { type: String, required: true, trim: true },
    platform: { type: String, default: "" },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    monthKey: { type: String, required: true }, // "YYYY-MM"
    notes: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model("Expense", expenseSchema);
