// // models/Blog.js
// import mongoose from "mongoose";

// const subttileHeadSchema = new mongoose.Schema(
//   {
//     beforeContent: { type: String, default: "" },
//     name: [{ type: String }],
//     benefits: [{ type: String }],
//     afterContent: { type: String, default: "" },
//   },
//   { _id: false }
// );

// const imagePosSchema = new mongoose.Schema(
//   {
//     section: String,
//     schemeIndex: Number,
//     benefitIndex: Number,
//     imageKey: String,
//   },
//   { _id: false }
// );

// const blogSchema = new mongoose.Schema(
//   {
//     id: { type: Number },
//     title: { type: String, required: true },
//     slug: {
//       type: String,
//       index: true,
//       lowercase: true,
//       trim: true,
//     },
//     description: { type: String },
//     date: {
//       type: String,
//       default: () => new Date().toLocaleDateString("en-GB"),
//     },
//     topics: [{ type: String, lowercase: true, trim: true }],
//     likes: { type: Number, default: 0 },
//     readTime: { type: Number, default: 5 },
//     blogTags: [{ type: String }],
//     imageKey: { type: String },

//     heading: { type: String },
//     subheading: { type: String },
//     subheading1: { type: String },
//     introduction: { type: String },
//     introduction1: { type: String },

//     subtitle: { type: String },
//     subtitleContent: { type: String },
//     subttileHead: [subttileHeadSchema],

//     subtitle1: { type: String },
//     subttileHead1: [subttileHeadSchema],

//     subtitle2: { type: String },
//     subttileHead2: [subttileHeadSchema],

//     subtitle3: { type: String },
//     subttileHead3: [subttileHeadSchema],

//     subtitle4: { type: String },
//     subttileHead4: [subttileHeadSchema],

//     subtitle5: { type: String },
//     subttileHead5: [subttileHeadSchema],

//     subtitle6: { type: String },
//     subttileHead6: [subttileHeadSchema],

//     imagePositions: [imagePosSchema],

//     paragraph1: { type: String },
//     outcome: { type: String },
//     lesson: { type: String },
//     paragraph2: { type: String },
//     outcome1: { type: String },
//     lesson1: { type: String },
//     paragraph3: { type: String },
//     outcome2: { type: String },
//     lesson2: { type: String },

//     conclusion: { type: String },
//     conclusion1: { type: String },
//     conclusion2: { type: String },

//     finalword: { type: String },
//     finalword1: { type: String },
//     finalword2: { type: String },
//     finalword3: { type: String },

//     nextSeries: { type: String },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Blog", blogSchema, "dynamic_blogs");

// models/Blog.js (Updated)
import mongoose from "mongoose";

// Schema for an ordered content block
const contentBlockSchema = new mongoose.Schema(
  {
    // The type of content: 'heading', 'subheading', 'paragraph', 'list', 'image'
    type: {
      type: String,
      enum: [
        "heading",
        "subheadingmain",
        "subheading",
        "paragraph",
        "list",
        "image",
        "list-item-pair",
      ], // Added list-item-pair for your specific use case
      required: true,
    },
    // Main text content (used for paragraph, heading, and list title)
    text: {
      type: String,
      default: "",
    },
    // Used specifically for 'list' type (simple bullet points)
    listItems: [
      {
        type: String,
      },
    ],
    // Used specifically for 'list-item-pair' type (Your Name/Benefit structure)
    itemPairs: [
      {
        name: { type: String, default: "" },
        benefit: { type: String, default: "" },
      },
    ],
    // Used specifically for 'image' type
    imageKey: {
      type: String,
    },
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
    id: { type: Number },
    title: { type: String, required: true },
    detailpagetitle: { type: String},
    slug: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String },
    // date: {
    //   type: String,
    //   default: () => new Date().toLocaleDateString("en-GB"),
    // },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    topic: {
      type: String,
      trim: true,
      default: "",
      required: true, // Set to required if every blog MUST have a topic
    },
    likes: { type: Number, default: 0 },
    readTime: { type: Number, default: 5 },
    blogTags: [{ type: String }],
    imageKey: { type: String }, // Main thumbnail/cover image

    infographicImageKey: {
      type: String,
      default: "",
    },
    infographicPosition: {
      type: String,
      enum: [
        'after-introduction', 
        'before-subheadingmain-2', 
        'before-subheadingmain-3', 
        'before-subheadingmain-4',
        'before-subheadingmain-5',
        'before-conclusion', 
      ],
      default: "before-subheadingmain-3",
    },

    // 🌟 THE GENERIC, ORDERED CONTENT ARRAY 🌟
    contentBlocks: [contentBlockSchema],

    // NOTE: All numbered fields and fixed content fields (heading, paragraph1, subtitle, etc.) are removed.
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema, "dynamic_blogs");
