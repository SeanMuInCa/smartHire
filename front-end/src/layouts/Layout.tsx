import { Outlet, Link, useLocation } from "react-router-dom";

export const Layout = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link 
                to="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  location.pathname === "/" 
                    ? "border-blue-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Job Seeker
              </Link>
              <Link 
                to="/employer" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  location.pathname === "/employer" 
                    ? "border-blue-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Employer Portal
              </Link>
              {/* <Link 
                to="/text-parser" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  location.pathname === "/text-parser" 
                    ? "border-blue-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                文本解析器
              </Link> */}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
