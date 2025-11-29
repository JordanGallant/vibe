import React, { useState, useEffect } from 'react';
import { TrendingUp, Users } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  progress: number;
  team: number;
}

interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  projects: number;
}

interface DashboardData {
  topProjects: Project[];
  users: User[];
}

export default function ProjectDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    // Load dummy data on page load
    const dummyData = {
      topProjects: [
        { id: 1, name: "Website Redesign", progress: 85, team: 8 },
        { id: 2, name: "Mobile App Launch", progress: 72, team: 12 },
        { id: 3, name: "API Integration", progress: 91, team: 5 }
      ],
      users: [
        { id: 1, name: "Sarah Johnson", role: "Project Manager", email: "sarah.j@company.com", projects: 3 },
        { id: 2, name: "Mike Chen", role: "Developer", email: "mike.c@company.com", projects: 5 },
        { id: 3, name: "Emily Davis", role: "Designer", email: "emily.d@company.com", projects: 4 },
        { id: 4, name: "James Wilson", role: "Developer", email: "james.w@company.com", projects: 6 },
        { id: 5, name: "Lisa Brown", role: "QA Engineer", email: "lisa.b@company.com", projects: 3 },
        { id: 6, name: "Alex Martinez", role: "DevOps", email: "alex.m@company.com", projects: 2 },
        { id: 7, name: "Rachel Green", role: "Designer", email: "rachel.g@company.com", projects: 4 }
      ]
    };
    
    setData(dummyData);
  }, []);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-2">Project Dashboard</h1>
          <p className="text-red-400">Displaying project analytics and team information</p>
        </header>

        <section className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="mr-2 text-red-500" size={24} />
            <h2 className="text-2xl font-bold text-red-500">Top 3 Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.topProjects?.map((project, index) => (
              <div key={project.id} className="bg-zinc-900 rounded-lg shadow-md p-6 border-t-4 border-red-500">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-red-400">{project.name}</h3>
                  <span className="text-2xl font-bold text-red-500">#{index + 1}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-300">Progress</span>
                    <span className="font-semibold text-red-400">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-red-300">
                  Team Size: <span className="font-semibold text-red-400">{project.team} members</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center mb-4">
            <Users className="mr-2 text-red-500" size={24} />
            <h2 className="text-2xl font-bold text-red-500">All Users</h2>
          </div>
          <div className="bg-zinc-900 rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-400">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-400">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-400">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-400">Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data?.users?.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800 transition">
                    <td className="px-6 py-4 text-sm font-medium text-red-300">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-red-300">{user.role}</td>
                    <td className="px-6 py-4 text-sm text-red-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-red-900 text-red-300 rounded-full text-sm font-semibold">
                        {user.projects}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}