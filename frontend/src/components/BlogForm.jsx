import { useState } from "react";

function BlogForm() {
  const initialState = {
    title: "",
    description: "",
    date: "",
    heading: "",
    subheading: "",
    subheading1: "",
    introduction: "",
    introduction1: "",
    points: "",
    blogTags: "",
    imageKey: "",
    detailImageKey: "",
    imagePositions: [
      {
        section: "",
        imageKey: "",
        position: "",
      },
    ],
    paragraph1: "",
    outcome: "",
    lesson: "",
    paragraph2: "",
    outcome1: "",
    lesson1: "",
    paragraph3: "",
    outcome2: "",
    lesson2: "",
    conclusion: "",
    conclusion1: "",
    conclusion2: "",
    finalword: "",
    finalword1: "",
    finalword2: "",
    finalword3: "",
    nextSeries: "",

    //  All subtitles + arrays
    subtitle: "",
    subttileHead: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
    subtitle1: "",
    subttileHead1: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
    subtitle2: "",
    subttileHead2: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
    subtitle3: "",
    subttileHead3: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
    subtitle4: "",
    subttileHead4: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
    subtitle5: "",
    subttileHead5: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
    subtitle6: "",
    subttileHead6: [{ beforeContent: "", name: [""], benefits: [""], afterContent: "" }],
  };

  const [blog, setBlog] = useState(initialState);

  
  // Basic field update
  const handleChange = (e) => {
    setBlog({ ...blog, [e.target.name]: e.target.value });
  };

  // Add new Name-Benefit pair
  const addNameBenefitPair = (headKey, sectionIndex) => {
    const updated = [...blog[headKey]];
    updated[sectionIndex].name.push("");
    updated[sectionIndex].benefits.push("");
    setBlog({ ...blog, [headKey]: updated });
  };

  // Add new entire section
  const addSubttileSection = (headKey) => {
    const updated = [...blog[headKey]];
    updated.push({ beforeContent: "", name: [""], benefits: [""], afterContent: "" });
    setBlog({ ...blog, [headKey]: updated });
  };


  const handleImagePositionChange = (index, field, value) => {
    const updated = [...blog.imagePositions];
    updated[index][field] = value;
    setBlog({ ...blog, imagePositions: updated });
  };


const handleSubmit = async (e) => {
    e.preventDefault();

    // The payload preparation logic looks correct
    const payload = {
        ...blog,
        blogTags: blog.blogTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        points: blog.points
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
    };

    try {
        // === CRITICAL FIX: Base URL Selection ===
        // Determine the environment. If the frontend is running on localhost, use the local backend port.
        const isLocal = 
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1';

        const BASE_URL = isLocal
            ? "http://localhost:5000" // Backend runs on 5000 locally
            : import.meta.env.VITE_API_BASE_URL || "https://dynamic-blog-server.onrender.com";

        const apiUrl = `${BASE_URL}/api/blogs/manual`;
        console.log(" Posting to:", apiUrl);

        // === CRITICAL BUG FIX: Correct JSON.stringify usage ===
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // FIX: Removed the incorrect second argument from JSON.stringify
            body: JSON.stringify(payload), 
        });

        // Response handling
        if (res.ok) {
            // NOTE: Replace alert() with a modal/message box in a real app
            alert("Blog added successfully!"); 
            setBlog(initialState);
        } else {
            let errorMessage = "Unknown error";
            try {
                const err = await res.json();
                errorMessage = err.message || JSON.stringify(err);
            } catch {
                errorMessage = await res.text();
            }
            alert("Error: " + errorMessage);
            console.error("Blog creation failed:", errorMessage);
        }
    } catch (err) {
        console.error(" Network or Fetch Error:", err);
        alert(" Network error: Could not connect to API.");
    }
};

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <h2>Add New Blog</h2>

      {/* ✅ Basic input fields */}
      {[
        "title","description","date","heading","subheading","introduction",
        "subheading1","introduction1","points","blogTags","imageKey","detailImageKey",
        "paragraph1","outcome","lesson","paragraph2","outcome1","lesson1",
        "paragraph3","outcome2","lesson2","conclusion","conclusion1","conclusion2",
        "finalword","finalword1","finalword2","finalword3","nextSeries"
      ].map((field) => (
        <div key={field}>
          <input
            style={{
              border: "1px solid black",
              padding: "1%",
              borderRadius: "8px",
              margin: "1%",
              width: "80%",
            }}
            name={field}
            placeholder={field}
            value={blog[field]}
            onChange={handleChange}
          />
        </div>
      ))}

{/* Image Positions Section */}
      <div style={{ marginTop: "30px" }}>
        <h3>Image Positions</h3>

        {blog.imagePositions.map((pos, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <input
              placeholder="Section (e.g., subtitle1)"
              value={pos.section}
              onChange={(e) =>
                handleImagePositionChange(index, "section", e.target.value)
              }
            />
            <input
              placeholder="Image Key (e.g., blogDetail20)"
              value={pos.imageKey}
              onChange={(e) =>
                handleImagePositionChange(index, "imageKey", e.target.value)
              }
            />
            <select
              value={pos.position}
              onChange={(e) =>
                handleImagePositionChange(index, "position", e.target.value)
              }
            >
              <option value="">Select Position</option>
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>

           
          </div>
        ))}

       
      </div>

      {/*Subtitle + SubttileHead Sections */}
      {["subtitle","subtitle1","subtitle2","subtitle3","subtitle4","subtitle5","subtitle6"].map((subField, idx) => {
        const headField = `subttileHead${idx === 0 ? "" : idx}`;
        const subtitleArray = blog[headField] || [];

        return (
          <div key={subField} style={{ marginBottom: "2rem" }}>
            <h3>{subField}</h3>
            <input
              style={{
                border: "1px solid black",
                padding: "1%",
                borderRadius: "8px",
                margin: "1%",
                width: "80%",
              }}
              name={subField}
              placeholder={subField}
              value={blog[subField]}
              onChange={handleChange}
            />

            <h4>{headField}</h4>

            {subtitleArray.map((section, sectionIndex) => (
              <div key={sectionIndex} style={{ marginLeft: "20px", marginBottom: "1rem" }}>
                {/* Before Content */}
                <textarea
                  style={{ margin: "0.5%", width: "80%", minHeight: "60px" }}
                  placeholder="Content above benefits"
                  value={section.beforeContent}
                  onChange={(e) => {
                    const updated = [...subtitleArray];
                    updated[sectionIndex].beforeContent = e.target.value;
                    setBlog({ ...blog, [headField]: updated });
                  }}
                />

                {/* Name–Benefit Pairs */}
                {section.name.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
                    <input
                      style={{ width: "40%" }}
                      placeholder="Name"
                      value={n}
                      onChange={(e) => {
                        const updated = [...subtitleArray];
                        updated[sectionIndex].name[i] = e.target.value;
                        setBlog({ ...blog, [headField]: updated });
                      }}
                    />
                    <input
                      style={{ width: "40%" }}
                      placeholder="Benefit"
                      value={section.benefits[i] || ""}
                      onChange={(e) => {
                        const updated = [...subtitleArray];
                        updated[sectionIndex].benefits[i] = e.target.value;
                        setBlog({ ...blog, [headField]: updated });
                      }}
                    />
                  </div>
                ))}

                {/* Add New Pair */}
                <button
                  type="button"
                  onClick={() => addNameBenefitPair(headField, sectionIndex)}
                >
                  + Add Name-Benefit
                </button>

                {/* After Content */}
                <textarea
                  style={{ margin: "0.5%", width: "80%", minHeight: "60px" }}
                  placeholder="Content below benefits"
                  value={section.afterContent}
                  onChange={(e) => {
                    const updated = [...subtitleArray];
                    updated[sectionIndex].afterContent = e.target.value;
                    setBlog({ ...blog, [headField]: updated });
                  }}
                />
              </div>
            ))}

            {/* Add new section */}
            <button
              type="button"
              onClick={() => addSubttileSection(headField)}
            >
              + Add New Section
            </button>
          </div>
        );
      })}

      

      {/* Save Blog */}
      <button
        type="submit"
        style={{
          border: "1px solid black",
          padding: "1%",
          borderRadius: "8px",
          margin: "2%",
        }}
      >
        Save Blog
      </button>
    </form>
  );
}

export default BlogForm;
