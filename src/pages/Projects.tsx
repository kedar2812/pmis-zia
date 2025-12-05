import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMockData } from '@/hooks/useMockData';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderOpen, Plus, Search, Calendar, DollarSign, TrendingUp, MapPin, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { getStatusColor } from '@/lib/colors';
import type { Project } from '@/mock/interfaces';

const Projects = () => {
  const { user } = useAuth();
  const { projects, addProject } = useMockData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if user can create projects
  const canCreateProject = user?.role === 'SPV_Official' || user?.role === 'PMNC_Team';

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.manager.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleCreateProject = async (projectData: Omit<Project, 'id'>) => {
    await addProject(projectData as Project);
  };

  const getStatusBadgeColor = (status: Project['status']) => {
    const statusColors = getStatusColor(status);
    return `${statusColors.bg} ${statusColors.text}`;
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track all infrastructure projects</p>
        </div>
        {canCreateProject && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-950 hover:bg-primary-900"
          >
            <Plus size={18} className="mr-2" />
            Create Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                aria-label="Search projects"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FolderOpen}
              title="No projects found"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : canCreateProject
                  ? 'Get started by creating your first project.'
                  : 'No projects available at the moment.'
              }
              actionLabel={canCreateProject && !searchQuery && statusFilter === 'all' ? 'Create Project' : undefined}
              onAction={canCreateProject && !searchQuery && statusFilter === 'all' ? () => setIsCreateModalOpen(true) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-primary-600">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-2 rounded-full transition-all ${
                            project.progress === 100
                              ? 'bg-success-600'
                              : project.progress >= 50
                              ? 'bg-primary-600'
                              : 'bg-warning-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>
                          {new Date(project.startDate).toLocaleDateString()} -{' '}
                          {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign size={16} className="text-gray-400" />
                        <span>Budget: {formatCurrency(project.budget)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={16} className="text-gray-400" />
                        <span>{project.manager}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="truncate">{project.location.address}</span>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="pt-2 border-t border-gray-200">
                      <span className="inline-block px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium border border-primary-200">
                        {project.category}
                      </span>
                    </div>

                    {/* Budget Utilization */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Budget Utilization</span>
                        <span className="font-medium">
                          {((project.spent / project.budget) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            (project.spent / project.budget) * 100 > 90
                              ? 'bg-error-600'
                              : (project.spent / project.budget) * 100 > 75
                              ? 'bg-warning-500'
                              : 'bg-success-600'
                          }`}
                          style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Spent: {formatCurrency(project.spent)}</span>
                        <span>Remaining: {formatCurrency(project.budget - project.spent)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold mt-1">{filteredProjects.length}</p>
                </div>
                <FolderOpen className="text-primary-600" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold mt-1">
                    {filteredProjects.filter((p) => p.status === 'In Progress').length}
                  </p>
                </div>
                <TrendingUp className="text-blue-600" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold mt-1">
                    {filteredProjects.filter((p) => p.status === 'Completed').length}
                  </p>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-lg font-bold mt-1">
                    {formatCurrency(filteredProjects.reduce((sum, p) => sum + p.budget, 0))}
                  </p>
                </div>
                <DollarSign className="text-primary-600" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProject}
      />
    </div>
  );
};

export default Projects;

