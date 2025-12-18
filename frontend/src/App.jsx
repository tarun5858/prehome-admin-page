import { BrowserRouter, Routes, Route,Navigate  } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Manageblogs from "./pages/Manageblogs";
import LeadsDashboard from "./components/LeadsDashboard";
import ChangePassword from "./pages/ChangePassword";
import AdminHome from "./pages/AdminHome";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

{/* New Admin Hub Route */}
          <Route
            path="/admin-home"
            element={
              <ProtectedRoute>
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-blogs"
            element={
              <ProtectedRoute>
                {" "}
                <Manageblogs />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads-dashboard"
            element={
              <ProtectedRoute>
                {" "}
                <LeadsDashboard />{" "}
              </ProtectedRoute>
            }
          />

           <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
