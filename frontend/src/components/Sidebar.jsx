import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Building, 
  FolderPlus, 
  Database, 
  BarChart3, 
  ChevronRight,
  Home
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { 
      path: '/admin', 
      name: 'Dashboard Overview', 
      icon: <LayoutDashboard className="w-5 h-5" />,
      end: true
    },
    { 
      path: '/admin/hotels/create', 
      name: 'Create New Hotel', 
      icon: <PlusCircle className="w-5 h-5" /> 
    },
    { 
      path: '/admin/hotels', 
      name: 'Manage Hotels', 
      icon: <Building className="w-5 h-5" /> 
    },
    { 
      path: '/admin/inventory', 
      name: 'Inventory Management', 
      icon: <Database className="w-5 h-5" /> 
    },
    { 
      path: '/admin/reports', 
      name: 'Analytics Reports', 
      icon: <BarChart3 className="w-5 h-5" /> 
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-[calc(100vh-73px)] p-6 flex flex-col justify-between shadow-lg">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-3 mb-4">
            Management Panel
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition duration-200 ${
                    isActive
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6">
        <NavLink
          to="/"
          className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition duration-200"
        >
          <Home className="w-5 h-5" />
          <span>Exit to Guest Site</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
