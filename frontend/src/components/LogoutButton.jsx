import { useAuth } from "../context/AuthContext";

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <button onClick={logout}         style={{border:"1px solid black",padding:"1%",borderRadius:"8px",margin:"1%"}}>
      Logout
    </button>
  );
};

export default LogoutButton;
