import BlogForm from "../components/BlogForm";
// import CSVUpload from "../components/CSVUpload";
// import DocxUpload from "../components/DocxUpload";
// import LogoutButton from "../components/LogoutButton";
import { useNavigate } from "react-router-dom";
function Manageblogs() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "20px",display:"flex",flexDirection:"column",justifyContent:'center',alignItems:"center",fontFamily:"Poppins" }} className="text-center">


      <h1>Blog Management Page</h1>
      <div className="container">
        <div className="row " style={{display:"flex", justifyContent:"flex-end"}}>
      <button style={{cursor: "pointer",
              padding: "15px 30px",
              fontSize: "1.1rem",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",}} onClick={() => navigate('/admin-home')}> Back to Dashboard</button>
        </div>
      </div>
      <BlogForm />
      <hr /><hr />
      {/* <CSVUpload /><br /> */}
      {/* <LogoutButton       /> */}
    </div>
  );
}

export default Manageblogs;
