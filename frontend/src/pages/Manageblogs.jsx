import BlogForm from "../components/BlogForm";
import CSVUpload from "../components/CSVUpload";
// import DocxUpload from "../components/DocxUpload";
import LogoutButton from "../components/LogoutButton";
function Manageblogs() {
  return (
    <div style={{ padding: "20px",display:"flex",flexDirection:"column",justifyContent:'center',alignItems:"center",fontFamily:"Poppins" }} className="text-center">

      <h1>Blog Management</h1>
      <BlogForm />
      <hr /><hr />
      <CSVUpload /><br />
      <LogoutButton       />
    </div>
  );
}

export default Manageblogs;
