import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

// function Layout({ children }) {
//     return (
//       <div className="d-flex flex-column min-vh-100">
//         <Navbar />
//         <main className="flex-fill" style={{ minHeight: "80vh" }}>
//           {children}
//         </main>
//         <Footer />
//       </div>
//     );
//   }
// src/components/Layout.js
function Layout({ children }) {
    return <>{children}</>;
  }
  
  
  

export default Layout;
