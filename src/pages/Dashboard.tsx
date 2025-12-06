import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMockData } from '@/hooks/useMockData';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { KPIDetailModal } from '@/components/dashboard/KPIDetailModal';
import { kpis, risks, tasks } from '@/mock';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<typeof kpis[0] | null>(null);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const { projects, addProject } = useMockData();

  // Check if user can create projects (SPV_Official or PMNC_Team)
  const canCreateProject = user?.role === 'SPV_Official' || user?.role === 'PMNC_Team';

  const handleKPIClick = (kpi: typeof kpis[0]) => {
    if (kpi.category === 'Risk') {
      navigate('/risk');
      toast.info(t('dashboard.navigatingToRisk'), {
        description: t('dashboard.viewingRiskDetails'),
      });
    } else {
      // Open KPI detail modal for all other KPIs
      setSelectedKPI(kpi);
      setIsKPIModalOpen(true);
    }
  };

  const handleCreateProject = async (projectData: Omit<typeof projects[0], 'id'>) => {
    await addProject(projectData as typeof projects[0]);
  };

  // Prepare data for charts
  const projectProgressData = projects.map((p) => ({
    name: p.name.substring(0, 20) + '...',
    progress: p.progress,
  }));

  const budgetData = projects.map((p) => ({
    name: p.name.substring(0, 15) + '...',
    budget: p.budget / 1000000,
    spent: p.spent / 1000000,
  }));

  const riskDistribution = risks.reduce((acc, risk) => {
    acc[risk.status] = (acc[risk.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskPieData = Object.entries(riskDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#f97316'];

  // Filter projects, tasks, and risks based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredTasks = useMemo(() => {
    const baseTasks = tasks.filter((task) => task.status === 'In Progress' || task.status === 'Not Started');
    if (!searchQuery) return baseTasks.slice(0, 5);
    const query = searchQuery.toLowerCase();
    return baseTasks
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.assignedTo.toLowerCase().includes(query) ||
          t.status.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [searchQuery]);

  const filteredRisks = useMemo(() => {
    const baseRisks = risks.filter((risk) => risk.status !== 'Closed');
    if (!searchQuery) return baseRisks.slice(0, 5);
    const query = searchQuery.toLowerCase();
    return baseRisks
      .filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          r.impact.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [searchQuery]);

  const upcomingTasks = filteredTasks;
  const activeRisks = filteredRisks;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 bg-white"
                aria-label="Search dashboard content"
              />
            </div>
          </div>
          {canCreateProject && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-950 hover:bg-primary-900"
            >
              <Plus size={18} className="mr-2" />
              {t('dashboard.createProject')}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.slice(0, 4).map((kpi) => {
          const isPositive = kpi.trend === 'up' || (kpi.trend === 'stable' && kpi.value >= kpi.target);
          return (
            <motion.div
              key={kpi.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-primary-600"
                onClick={() => handleKPIClick(kpi)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{kpi.name}</p>
                      <p className="text-2xl font-bold mt-2">
                        {kpi.value} {kpi.unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('common.target')}: {kpi.target} {kpi.unit}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${isPositive ? 'bg-success-50' : 'bg-error-50'}`}>
                      {isPositive ? (
                        <TrendingUp className="text-success-600" size={24} />
                      ) : (
                        <TrendingDown className="text-error-600" size={24} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentProjects')} - {t('dashboard.progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget vs Spent Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.budgetVsSpent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                  formatter={(value: number) => [`₹${value.toFixed(2)} Cr`, '']}
                  labelFormatter={(label) => `Project: ${label}`}
                />
                <Legend />
                <Bar dataKey="budget" fill="#cbd5e1" name={t('common.budget')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="#0284c7" name={t('common.spent')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeRisks')} - {t('dashboard.riskDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.projectTimeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projects.map((p) => ({ name: p.name.substring(0, 15), progress: p.progress }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="progress" stroke="#0284c7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Active Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.recentProjects')}
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredProjects.length} {t('common.found')})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-xs text-gray-600">{project.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{project.progress}%</p>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-primary-600 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Risks */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.activeRisks')}
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({activeRisks.length} {t('common.found')})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRisks.length > 0 ? (
                activeRisks.map((risk) => {
                const impactColors: Record<string, string> = {
                  Low: 'bg-success-50 text-success-700',
                  Medium: 'bg-warning-50 text-warning-700',
                  High: 'bg-accent-50 text-accent-700',
                  Critical: 'bg-error-50 text-error-700',
                };

                return (
                  <div key={risk.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{risk.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{risk.category}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${impactColors[risk.impact]}`}
                      >
                        {risk.impact}
                      </span>
                    </div>
                  </div>
                );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? t('dashboard.noRisksFound') : t('dashboard.noActiveRisks')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('dashboard.upcomingTasks')}
            {searchQuery && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                  ({upcomingTasks.length} {t('common.found')})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{task.name}</p>
                  <p className="text-sm text-gray-600">
                    {task.startDate} - {task.endDate}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{task.progress}%</span>
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      task.status === 'Completed'
                        ? 'bg-success-50 text-success-700'
                        : task.status === 'In Progress'
                        ? 'bg-primary-50 text-primary-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? t('dashboard.noTasksFound') : t('dashboard.noUpcomingTasks')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProject}
      />

      <KPIDetailModal
        isOpen={isKPIModalOpen}
        onClose={() => {
          setIsKPIModalOpen(false);
          setSelectedKPI(null);
        }}
        kpi={selectedKPI}
      />
    </div>
  );
};

export default Dashboard;

