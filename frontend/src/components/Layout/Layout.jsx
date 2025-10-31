import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
