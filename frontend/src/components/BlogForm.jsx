// import { useState } from "react";

// function BlogForm() {
//   const initialState = {
//     title: "",
//     description: "",
//     date: "",
//     heading: "",
//     subheading: "",
//     subheading1: "",
//     introduction: "",
//     introduction1: "",
//     topics:"",
//     points: "",
//     blogTags: "",
//     imageKey: "",
//     detailImageKey: "",
//     imagePositions: [
//       {
//         section: "",
//         imageKey: "",
//         position: "",
//       },
//     ],
//     paragraph1: "",
//     outcome: "",
//     lesson: "",
//     paragraph2: "",
//     outcome1: "",
//     lesson1: "",
//     paragraph3: "",
//     outcome2: "",
//     lesson2: "",
//     conclusion: "",
//     conclusion1: "",
//     conclusion2: "",
//     finalword: "",
//     finalword1: "",
//     finalword2: "",
//     finalword3: "",
//     nextSeries: "",

//     //  All subtitles + arrays
//     subtitle: "",
//     subttileHead: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//     subtitle1: "",
//     subttileHead1: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//     subtitle2: "",
//     subttileHead2: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//     subtitle3: "",
//     subttileHead3: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//     subtitle4: "",
//     subttileHead4: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//     subtitle5: "",
//     subttileHead5: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//     subtitle6: "",
//     subttileHead6: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
//   };

//   const [blog, setBlog] = useState(initialState);

  
//   // Basic field update
//   const handleChange = (e) => {
//     setBlog({ ...blog, [e.target.name]: e.target.value });
//   };

//   // Add new Name-Benefit pair
//   const addNameBenefitPair = (headKey, sectionIndex) => {
//     const updated = [...blog[headKey]];
//     updated[sectionIndex].name.push("");
//     updated[sectionIndex].benefits.push("");
//     setBlog({ ...blog, [headKey]: updated });
//   };

//   // Add new entire section
//   const addSubttileSection = (headKey) => {
//     const updated = [...blog[headKey]];
//     updated.push({ beforeContent: "", name: [""], benefits: [""], afterContent: "" });
//     setBlog({ ...blog, [headKey]: updated });
//   };


//   const handleImagePositionChange = (index, field, value) => {
//     const updated = [...blog.imagePositions];
//     updated[index][field] = value;
//     setBlog({ ...blog, imagePositions: updated });
//   };


// const handleSubmit = async (e) => {
//     e.preventDefault();

//     // The payload preparation logic looks correct
//     // const payload = {
//     //     ...blog,
//     //     blogTags: blog.blogTags
//     //         .split(",")
//     //         .map((t) => t.trim())
//     //         .filter(Boolean),
//     //     points: blog.points
//     //         .split(",")
//     //         .map((t) => t.trim())
//     //         .filter(Boolean),
//     // };
//     const payload = {
//     ...blog,
//     topics: blog.topic ? [blog.topic.toLowerCase().trim()] : [],
//     blogTags: [], // no longer used for related blogs
//     points: blog.points
//         .split(",")
//         .map((t) => t.trim())
//         .filter(Boolean),
// };

//     try {
//         // === CRITICAL FIX: Base URL Selection ===
//         // Determine the environment. If the frontend is running on localhost, use the local backend port.
//         const isLocal = 
//             window.location.hostname === 'localhost' || 
//             window.location.hostname === '127.0.0.1';

//         const BASE_URL = isLocal
//             ? "http://localhost:5000" // Backend runs on 5000 locally
//             : import.meta.env.VITE_API_BASE_URL || "https://dynamic-blog-server.onrender.com";

//         const apiUrl = `${BASE_URL}/api/blogs/manual`;
//         console.log(" Posting to:", apiUrl);

//         // === CRITICAL BUG FIX: Correct JSON.stringify usage ===
//         const res = await fetch(apiUrl, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             // FIX: Removed the incorrect second argument from JSON.stringify
//             body: JSON.stringify(payload), 
//         });

//         // Response handling
//         if (res.ok) {
//             // NOTE: Replace alert() with a modal/message box in a real app
//             alert("Blog added successfully!"); 
//             setBlog(initialState);
//         } else {
//             let errorMessage = "Unknown error";
//             try {
//                 const err = await res.json();
//                 errorMessage = err.message || JSON.stringify(err);
//             } catch {
//                 errorMessage = await res.text();
//             }
//             alert("Error: " + errorMessage);
//             console.error("Blog creation failed:", errorMessage);
//         }
//     } catch (err) {
//         console.error(" Network or Fetch Error:", err);
//         alert(" Network error: Could not connect to API.");
//     }
// };

//   return (
//     <form onSubmit={handleSubmit} style={{ width: "100%" }}>
//       <h2>Add New Blog</h2>

//       {/* ✅ Basic input fields */}
//       {[
//         "title","description","date","heading","subheading","introduction",
//         "subheading1","introduction1","topic","imageKey","detailImageKey",
//         "paragraph1","outcome","lesson","paragraph2","outcome1","lesson1",
//         "paragraph3","outcome2","lesson2","conclusion","conclusion1","conclusion2",
//         "finalword","finalword1","finalword2","finalword3","nextSeries"
//       ].map((field) => (
//         <div key={field}>
//           <input
//             style={{
//               border: "1px solid black",
//               padding: "1%",
//               borderRadius: "8px",
//               margin: "1%",
//               width: "80%",
//             }}
//             name={field}
//             placeholder={field}
//             value={blog[field]}
//             onChange={handleChange}
//           />
//         </div>
//       ))}

// {/* Image Positions Section */}
//       <div style={{ marginTop: "30px" }}>
//         <h3>Image Positions</h3>

//         {blog.imagePositions.map((pos, index) => (
//           <div
//             key={index}
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "10px",
//               marginBottom: "10px",
//             }}
//           >
//             <input
//               placeholder="Section (e.g., subtitle1)"
//               value={pos.section}
//               onChange={(e) =>
//                 handleImagePositionChange(index, "section", e.target.value)
//               }
//             />
//             <input
//               placeholder="Image Key (e.g., blogDetail20)"
//               value={pos.imageKey}
//               onChange={(e) =>
//                 handleImagePositionChange(index, "imageKey", e.target.value)
//               }
//             />
//             <select
//               value={pos.position}
//               onChange={(e) =>
//                 handleImagePositionChange(index, "position", e.target.value)
//               }
//             >
//               <option value="">Select Position</option>
//               <option value="before">Before</option>
//               <option value="after">After</option>
//             </select>

           
//           </div>
//         ))}

       
//       </div>

//       {/*Subtitle + SubttileHead Sections */}
//       {["subtitle","subtitle1","subtitle2","subtitle3","subtitle4","subtitle5","subtitle6"].map((subField, idx) => {
//         const headField = `subttileHead${idx === 0 ? "" : idx}`;
//         const subtitleArray = blog[headField] || [];

//         return (
//           <div key={subField} style={{ marginBottom: "2rem" }}>
//             <h3>{subField}</h3>
//             <input
//               style={{
//                 border: "1px solid black",
//                 padding: "1%",
//                 borderRadius: "8px",
//                 margin: "1%",
//                 width: "80%",
//               }}
//               name={subField}
//               placeholder={subField}
//               value={blog[subField]}
//               onChange={handleChange}
//             />

//             <h4>{headField}</h4>

//             {subtitleArray.map((section, sectionIndex) => (
//               <div key={sectionIndex} style={{ marginLeft: "20px", marginBottom: "1rem" }}>
//                 {/* Before Content */}
//                 <textarea
//                   style={{ margin: "0.5%", width: "80%", minHeight: "60px" }}
//                   placeholder="Content above benefits"
//                   value={section.beforeContent}
//                   onChange={(e) => {
//                     const updated = [...subtitleArray];
//                     updated[sectionIndex].beforeContent = e.target.value;
//                     setBlog({ ...blog, [headField]: updated });
//                   }}
//                 />

//                 {/* Name–Benefit Pairs */}
//                 {section.name.map((n, i) => (
//                   <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
//                     <input
//                       style={{ width: "40%" }}
//                       placeholder="Name"
//                       value={n}
//                       onChange={(e) => {
//                         const updated = [...subtitleArray];
//                         updated[sectionIndex].name[i] = e.target.value;
//                         setBlog({ ...blog, [headField]: updated });
//                       }}
//                     />
//                     <input
//                       style={{ width: "40%" }}
//                       placeholder="Benefit"
//                       value={section.benefits[i] || ""}
//                       onChange={(e) => {
//                         const updated = [...subtitleArray];
//                         updated[sectionIndex].benefits[i] = e.target.value;
//                         setBlog({ ...blog, [headField]: updated });
//                       }}
//                     />
//                   </div>
//                 ))}

//                 {/* Add New Pair */}
//                 <button
//                   type="button"
//                   onClick={() => addNameBenefitPair(headField, sectionIndex)}
//                 >
//                   + Add Name-Benefit
//                 </button>

//                 {/* After Content */}
//                 <textarea
//                   style={{ margin: "0.5%", width: "80%", minHeight: "60px" }}
//                   placeholder="Content below benefits"
//                   value={section.afterContent}
//                   onChange={(e) => {
//                     const updated = [...subtitleArray];
//                     updated[sectionIndex].afterContent = e.target.value;
//                     setBlog({ ...blog, [headField]: updated });
//                   }}
//                 />
//               </div>
//             ))}

//             {/* Add new section */}
//             <button
//               type="button"
//               onClick={() => addSubttileSection(headField)}
//             >
//               + Add New Section
//             </button>
//           </div>
//         );
//       })}

      

//       {/* Save Blog */}
//       <button
//         type="submit"
//         style={{
//           border: "1px solid black",
//           padding: "1%",
//           borderRadius: "8px",
//           margin: "2%",
//         }}
//       >
//         Save Blog
//       </button>
//     </form>
//   );
// }

// export default BlogForm;


// BlogForm.jsx (Generic Structure)
import { useState } from "react";

// Initial state for a new blog using the generic structure
const initialState = {
  title: "",
  detailpagetitle:"",
  description: "",
  topic: "",
  blogTags: "",
  imageKey: "", // Main thumbnail image
  
  // 🌟 The core of the new structure
  contentBlocks: [
    { type: "heading", text: "Heading" },
    { type: "paragraph", text: "Introduction" },
  ],

  // date: new Date().toISOString().split('T')[0], // For the new date input (defaults to today)
  date: new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
}).replace(/\s/g, ' ').replace(',', ''),

    infographicImageKey: '', // Key for the infographic image
    infographicPosition: 'after-introduction', // Default position for the infographic
};

const BLOCK_TYPES = [
  { value: "heading", label: "Heading (H2/H3)" },
  { value: "subheadingmain", label: "Subheading Main" },
  { value: "subheading", label: "Subheading (H4/H5)" },
  { value: "paragraph", label: "Paragraph" },
  { value: "list", label: "Simple Bullet List" },
  { value: "list-item-pair", label: "Name/Benefit List" },
  { value: "image", label: "Image Block" },
];

function BlogForm() {
  const [blog, setBlog] = useState(initialState);
  const [newBlockType, setNewBlockType] = useState("paragraph"); // State for "Add Block" dropdown

  // --- Handlers for Top-Level Fields ---
  const handleChange = (e) => {
    setBlog({ ...blog, [e.target.name]: e.target.value });
  };

  // --- Handlers for Content Blocks ---

  // Update a field (text, imageKey) on a specific content block
  const updateBlockField = (index, field, value) => {
    const updatedBlocks = [...blog.contentBlocks];
    updatedBlocks[index][field] = value;
    setBlog({ ...blog, contentBlocks: updatedBlocks });
  };

  // Update simple list items for type 'list'
  const updateListItems = (index, textValue) => {
    const listItems = textValue.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    updateBlockField(index, 'listItems', listItems);
  };

  // Update an item pair for type 'list-item-pair'
  const updateItemPair = (blockIndex, pairIndex, pairField, value) => {
    const updatedBlocks = [...blog.contentBlocks];
    const itemPairs = updatedBlocks[blockIndex].itemPairs;
    itemPairs[pairIndex][pairField] = value;
    setBlog({ ...blog, contentBlocks: updatedBlocks });
  };

  // Add a new item pair to a list-item-pair block
  const addItemPair = (blockIndex) => {
    const updatedBlocks = [...blog.contentBlocks];
    updatedBlocks[blockIndex].itemPairs.push({ name: "", benefit: "" });
    setBlog({ ...blog, contentBlocks: updatedBlocks });
  };
  
  // Add a new content block to the end of the array
  const addBlock = () => {
    const newBlock = { type: newBlockType, text: "" };
    
    // Initialize specific fields based on type
    if (newBlockType === 'list') {
        newBlock.listItems = [""];
    } else if (newBlockType === 'list-item-pair') {
        newBlock.itemPairs = [{ name: "", benefit: "" }];
    } else if (newBlockType === 'image') {
        newBlock.imageKey = "";
    }
    
    setBlog({ ...blog, contentBlocks: [...blog.contentBlocks, newBlock] });
  };

  // Remove a content block
  const removeBlock = (index) => {
    const updatedBlocks = blog.contentBlocks.filter((_, i) => i !== index);
    setBlog({ ...blog, contentBlocks: updatedBlocks });
  };

  // --- Component to render different block types ---
  const BlockRenderer = ({ block, index }) => {
    const commonProps = {
      style: { 
        width: "98%", 
        padding: "8px", 
        marginBottom: "5px", 
        border: "1px solid #ccc",
        borderRadius: "4px" 
      }
    };
    
    switch (block.type) {
      case "heading":
      case "subheading":
      case "subheadingmain":
        return (
          <input
            {...commonProps}
            placeholder={`${block.type.toUpperCase()} Text`}
            value={block.text}
            onChange={(e) => updateBlockField(index, "text", e.target.value)}
          />
        );
      case "paragraph":
        return (
          <textarea
            {...commonProps}
            rows="4"
            placeholder="Paragraph Content"
            value={block.text}
            onChange={(e) => updateBlockField(index, "text", e.target.value)}
          />
        );
      case "list":
        return (
            <textarea
                {...commonProps}
                rows="6"
                placeholder="Enter each bullet point on a new line..."
                value={block.listItems.join('\n')}
                onChange={(e) => updateListItems(index, e.target.value)}
            />
        );
      case "image":
        return (
          <input
            {...commonProps}
            placeholder="Image Key (e.g., blog-detail-123)"
            value={block.imageKey}
            onChange={(e) => updateBlockField(index, "imageKey", e.target.value)}
          />
        );
      case "list-item-pair":
        return (
          <div>
            <textarea
                {...commonProps}
                rows="2"
                placeholder="Optional introductory text for the list-item-pair section"
                value={block.text}
                onChange={(e) => updateBlockField(index, "text", e.target.value)}
            />
            {block.itemPairs.map((pair, pairIndex) => (
              <div key={pairIndex} style={{ display: "flex", gap: "10px", marginBottom: "5px", marginLeft: '10px' }}>
                <input
                  style={{ width: "45%" }}
                  placeholder="Name/Title"
                  value={pair.name}
                  onChange={(e) => updateItemPair(index, pairIndex, "name", e.target.value)}
                />
                <input
                  style={{ width: "45%" }}
                  placeholder="Benefit/Description"
                  value={pair.benefit}
                  onChange={(e) => updateItemPair(index, pairIndex, "benefit", e.target.value)}
                />
              </div>
            ))}
            <button type="button" onClick={() => addItemPair(index)} style={{ marginLeft: '10px' }}>
              + Add Pair
            </button>
          </div>
        );
      default:
        return <p>Unknown Block Type: {block.type}</p>;
    }
  };

  // --- Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Defensively assign values to ensure they are strings
    const safeTopics = blog.topic || '';
    const safeTags = blog.blogTags || '';


    // 2. Prepare Payload
    const payload = {
        ...blog,
        
        // --- UPDATED TOPICS ---
        // Only trim the string. It remains a single string.
        topic: safeTopics.trim(), 

        // --- BLOG TAGS (Remains an array of strings, filtered for safety) ---
        blogTags: safeTags.split(',')
                          .map(t => t.trim())
                          .filter(t => t.length > 0),
                          
        // The core data
        contentBlocks: blog.contentBlocks, 

        infographicImageKey: blog.infographicImageKey, //  ENSURE THIS IS INCLUDED
        infographicPosition: blog.infographicPosition, // ENSURE THIS IS INCLUDED
        date: blog.date,
    };
    
    // Check if topics is an empty string after trimming and set it to null or undefined 
    // if your backend prefers that for empty fields (optional, but good practice):
    if (payload.topic === '') {
        payload.topic = null; 
    }

    // 1. Prepare Payload
    // const payload = {
    //     ...blog,
    //     // Convert comma-separated strings to arrays, clean, and filter empty values
    //     topics: blog.topics.split(',').map(t => t.trim()).filter(t => t.length > 0),
    //     blogTags: blog.blogTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
    //     // The core data: contentBlocks is already an array of objects
    //     contentBlocks: blog.contentBlocks, 
    // };
//         const payload = {
//     ...blog,
//     topics: blog.topic ? [blog.topic.toLowerCase().trim()] : [],
//     blogTags: [], // no longer used for related blogs
//     points: blog.points
//         .split(",")
//         .map((t) => t.trim())
//         .filter(Boolean),
// };
    
    // --- 2. API Submission Logic (Uncommented and Ready) ---
    
    try {
        // Determine the Base URL (using your logic from the original file)
        const isLocal = 
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1';

        const BASE_URL = isLocal
            ? "http://localhost:5000" // Adjust port if needed
            : import.meta.env.VITE_API_BASE_URL || "https://dynamic-blog-server.onrender.com";

        // IMPORTANT: Use the correct API path for POSTing the new blog
        const apiUrl = `${BASE_URL}/api/blogs/manual`; // Assuming this is your creation endpoint
        console.log("🚀 Posting blog to:", apiUrl);

        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // Send the prepared JSON payload
        });

        // 3. Handle Response
        if (res.ok) {
            alert(" Blog added successfully!"); 
            // Reset the form state after successful submission
            setBlog(initialState); 
        } else {
            let errorMessage = "Unknown error during creation.";
            try {
                const err = await res.json();
                errorMessage = err.message || JSON.stringify(err);
            } catch (e) {
                errorMessage = await res.text();
                console.log(e)
            }
            alert(` Error creating blog: ${errorMessage}`);
            console.error("Blog creation failed:", errorMessage);
        }
    } catch (err) {
        console.error("Network or Fetch Error:", err);
        alert("🚨 Network error: Could not connect to the API.");
    }
};

  return (
    <form onSubmit={handleSubmit} style={{ width: "80%", margin: "0 auto", padding: "20px" }}>
      <h2>Dynamic Blog Editor</h2>
      
      {/* 1. Meta Fields */}
      <div style={{ marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
        <input name="title" placeholder="Blog Title" value={blog.title} onChange={handleChange} style={{ width: "98%", padding: "10px", marginBottom: "10px" }} />
        <input name="detailpagetitle" placeholder="Blog detailpagetitle" value={blog.detailpagetitle} onChange={handleChange} style={{ width: "98%", padding: "10px", marginBottom: "10px" }} />
        <textarea name="description" placeholder="Description" value={blog.description} onChange={handleChange} rows="2" style={{ width: "98%", padding: "10px", marginBottom: "10px" }} />
        <input name="topic" placeholder="Topic" value={blog.topic} onChange={handleChange} style={{ width: "98%", padding: "10px", marginBottom: "10px" }} />
        <input name="imageKey" placeholder="Main Thumbnail Image Key" value={blog.imageKey} onChange={handleChange} style={{ width: "98%", padding: "10px", marginBottom: "10px" }} />
      </div>

      <div className="form-group mb-3">
    <label htmlFor="dateInput">Date Published (Optional)</label>
    <input
        id="dateInput"
        type="date"
        className="form-control"
        placeholder="YYYY-MM-DD"
        name="date"
        value={blog.date}
        onChange={handleChange}
    />
    <small className="form-text text-muted">Override the current date.</small>
</div>


{/* BlogForm.jsx (Inside the main form body, e.g., near the existing imageKey) */}
<br />
<div className="form-group mb-3">
    <label htmlFor="infographicImageKey">Infographic Image Key</label>
    <input
        id="infographicImageKey"
        type="text"
        className="form-control"
        placeholder="e.g., blogImageInfographic1"
        name="infographicImageKey"
        value={blog.infographicImageKey}
        onChange={handleChange}
    />
</div>
<br />
<div className="form-group mb-3">
    <label htmlFor="infographicPosition">Infographic Position</label>
    <select
        id="infographicPosition"
        className="form-control"
        name="infographicPosition"
        value={blog.infographicPosition}
        onChange={handleChange}
    >
        <option value="after-introduction">After Introduction</option>
        <option value="before-subheadingmain-2">Before subheadingMain 2</option>
        <option value="before-subheadingmain-3">Before subheadingMain 3</option> {/* ⬅️ NEW */}
        <option value="before-subheadingmain-4">Before subheadingMain 4</option> {/* ⬅️ NEW */}
        <option value="before-subheadingmain-5">Before subheadingMain 5</option> {/* ⬅️ NEW */}
        
        <option value="before-conclusion">Before Conclusion</option>
        <option value="bottom-of-blog">Bottom of Blog</option>
    </select>
</div>

      {/* 2. Content Blocks (The Dynamic Part) */}
      <h3>Blog Content Structure</h3>
      <div style={{ border: "2px solid #ddd", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
        {blog.contentBlocks.map((block, index) => (
          <div key={index} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #f0f0f0", borderRadius: "4px", backgroundColor: "#fff" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ textTransform: 'uppercase' }}>{index + 1}. {BLOCK_TYPES.find(b => b.value === block.type)?.label || 'Content Block'}</strong>
                <button type="button" onClick={() => removeBlock(index)} style={{ background: 'salmon', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                    Remove
                </button>
            </div>
            <BlockRenderer block={block} index={index} />
          </div>
        ))}
      </div>
      
      {/* 3. Add New Block Control */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '30px' }}>
        <select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value)} style={{ padding: '10px' }}>
          {BLOCK_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <button type="button" onClick={addBlock} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
          + Add New Block
        </button>
      </div>

      {/* 4. Save Button */}
      <button type="submit" style={{ padding: "15px 30px", fontSize: "1.1rem", backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}>
      Save Blog
      </button>
    </form>
  );
}

export default BlogForm;