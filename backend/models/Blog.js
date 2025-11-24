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

      // START OF CHANGES: Add Infographic 2
        infographicImageKey2: { type: String }, // New key for the second image
        infographicPosition2: {                // New position field for the second image
            type: String,
            enum: [
                'after-introduction', 
                'before-subheadingmain-2', 
                'before-subheadingmain-3', 
                'before-subheadingmain-4',
                'before-subheadingmain-5',
                'before-conclusion', 
                'bottom-of-blog',
            ],
            default: "", // Set default to empty so it's not inserted unless selected
        },
        //  END OF CHANGES 

      default: "before-subheadingmain-3",
    },

    //  THE GENERIC, ORDERED CONTENT ARRAY 
    contentBlocks: [contentBlockSchema],

    // NOTE: All numbered fields and fixed content fields (heading, paragraph1, subtitle, etc.) are removed.
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema, "dynamic_blogs");
