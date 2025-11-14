// models/Blog.js
import mongoose from "mongoose";

const subttileHeadSchema = new mongoose.Schema(
  {
    beforeContent: { type: String, default: "" },
    name: [{ type: String }],
    benefits: [{ type: String }],
    afterContent: { type: String, default: "" },
  },
  { _id: false }
);

const imagePosSchema = new mongoose.Schema(
  {
    section: String,
    schemeIndex: Number,
    benefitIndex: Number,
    imageKey: String,
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
    id: { type: Number },
    title: { type: String, required: true },
    slug: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString("en-GB"),
    },
    likes: { type: Number, default: 0 },
    readTime: { type: Number, default: 5 },
    blogTags: [{ type: String }],
    imageKey: { type: String },

    heading: { type: String },
    subheading: { type: String },
    subheading1: { type: String },
    introduction: { type: String },
    introduction1: { type: String },

    subtitle: { type: String },
    subtitleContent: { type: String },
    subttileHead: [subttileHeadSchema],

    subtitle1: { type: String },
    subttileHead1: [subttileHeadSchema],

    subtitle2: { type: String },
    subttileHead2: [subttileHeadSchema],

    subtitle3: { type: String },
    subttileHead3: [subttileHeadSchema],

    subtitle4: { type: String },
    subttileHead4: [subttileHeadSchema],

    subtitle5: { type: String },
    subttileHead5: [subttileHeadSchema],

    subtitle6: { type: String },
    subttileHead6: [subttileHeadSchema],

    imagePositions: [imagePosSchema],

    paragraph1: { type: String },
    outcome: { type: String },
    lesson: { type: String },
    paragraph2: { type: String },
    outcome1: { type: String },
    lesson1: { type: String },
    paragraph3: { type: String },
    outcome2: { type: String },
    lesson2: { type: String },

    conclusion: { type: String },
    conclusion1: { type: String },
    conclusion2: { type: String },

    finalword: { type: String },
    finalword1: { type: String },
    finalword2: { type: String },
    finalword3: { type: String },

    nextSeries: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema, "dynamic_blogs");
