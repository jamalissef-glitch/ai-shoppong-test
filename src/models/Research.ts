import mongoose, { Schema, models, model } from "mongoose";

const sourceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const researchSchema = new Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    summary: {
      type: String,
      default: "",
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Research =
  models.Research || model("Research", researchSchema);

export default Research;