import React from 'react';
import { 
  Document, 
  useMedplum, 
  useSearch,
  useMedplumNavigate
} from '@medplum/react';
import { 
  Title, 
  Card, 
  Group, 
  Button, 
  Stack, 
  Text,
  Badge,
  SimpleGrid,
  Alert,
  ActionIcon
} from '@mantine/core';
import { 
  IconBuilding,
  IconUsers,
  IconActivity,
  IconFileSearch,
  IconReportAnalytics,
  IconChevronRight,
  IconShield,
  IconDatabase,
  IconBrain
} from '@tabler/icons-react';

export function AdminDashboard(): React.JSX.Element {
  const medplum = useMedplum();
  const navigate = useMedplumNavigate();

  // Get basic counts for overview
  const [projectsBundle] = useSearch('Project', { _count: '100' });
  const [usersBundle] = useSearch('User', { _count: '100' });
  const [patientsBundle] = useSearch('Patient', { _count: '1000' });
  const [analysesBundle] = useSearch('DiagnosticReport', { 
    code: 'ophtha-ai-analysis',
    _count: '1000'
  });

  const totalProjects = projectsBundle?.total || 0;
  const totalUsers = usersBundle?.total || 0;
  const totalPatients = patientsBundle?.total || 0;
  const totalAnalyses = analysesBundle?.total || 0;

  const adminModules = [
    {
      title: 'Site Metrics',
      description: 'View performance metrics and usage statistics for your current site',
      icon: <IconReportAnalytics size={24} />,
      href: '/metrics',
      color: 'blue',
      stats: `${totalPatients} patients, ${totalAnalyses} analyses`
    },
    {
      title: 'Project Management',
      description: 'Create and manage hospital projects and site configurations',
      icon: <IconBuilding size={24} />,
      href: '/admin/projects',
      color: 'green',
      stats: `${totalProjects} active projects`
    },
    {
      title: 'User Management', 
      description: 'Invite users, manage memberships, and configure access policies',
      icon: <IconUsers size={24} />,
      href: '/admin/users',
      color: 'orange',
      stats: `${totalUsers} system users`
    },
    {
      title: 'System Health',
      description: 'Monitor system performance, health status, and usage across all projects',
      icon: <IconActivity size={24} />,
      href: '/admin/health',
      color: 'violet',
      stats: 'Real-time monitoring'
    },
    {
      title: 'Audit Logs',
      description: 'Review security audit trails and compliance logs',
      icon: <IconFileSearch size={24} />,
      href: '/admin/audit',
      color: 'red',
      stats: 'HIPAA compliant logging'
    }
  ];

  return (
    <Document>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Admin Portal</Title>
            <Text c="dimmed">System administration and management tools</Text>
          </div>
          <Badge size="lg" color="grape">
            Super Admin
          </Badge>
        </Group>

        <Alert icon={<IconShield size={16} />} title="Security Notice" color="blue">
          You have full administrative access to all system functions. Please ensure you follow 
          security best practices and HIPAA compliance guidelines.
        </Alert>

        {/* Quick System Overview */}
        <Card shadow="sm" padding="lg" withBorder>
          <Title order={4} mb="md">System Overview</Title>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <div style={{ textAlign: 'center' }}>
              <IconBuilding size={32} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
              <Text size="xl" fw={700}>{totalProjects}</Text>
              <Text size="sm" c="dimmed">Projects</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <IconUsers size={32} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
              <Text size="xl" fw={700}>{totalUsers}</Text>
              <Text size="sm" c="dimmed">Users</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <IconDatabase size={32} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
              <Text size="xl" fw={700}>{totalPatients}</Text>
              <Text size="sm" c="dimmed">Patients</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <IconBrain size={32} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
              <Text size="xl" fw={700}>{totalAnalyses}</Text>
              <Text size="sm" c="dimmed">AI Analyses</Text>
            </div>
          </SimpleGrid>
        </Card>

        {/* Admin Modules */}
        <Card shadow="sm" padding="lg" withBorder>
          <Title order={4} mb="md">Administrative Functions</Title>
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {adminModules.map((module) => (
              <Card 
                key={module.title}
                shadow="xs" 
                padding="md" 
                withBorder
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => navigate(module.href)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Group justify="space-between" align="flex-start" mb="md">
                  <div style={{ color: `var(--mantine-color-${module.color}-6)` }}>
                    {module.icon}
                  </div>
                  <ActionIcon 
                    variant="light" 
                    color={module.color}
                    size="sm"
                  >
                    <IconChevronRight size={14} />
                  </ActionIcon>
                </Group>
                
                <Stack gap="xs">
                  <Text fw={500} size="md">{module.title}</Text>
                  <Text size="sm" c="dimmed" style={{ minHeight: '40px' }}>
                    {module.description}
                  </Text>
                  <Badge 
                    variant="light" 
                    color={module.color} 
                    size="sm"
                  >
                    {module.stats}
                  </Badge>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Card>

        {/* Quick Actions */}
        <Card shadow="sm" padding="lg" withBorder>
          <Title order={4} mb="md">Quick Actions</Title>
          <Group>
            <Button 
              leftSection={<IconUsers size={16} />}
              onClick={() => navigate('/admin/users')}
            >
              Invite New User
            </Button>
            <Button 
              variant="outline"
              leftSection={<IconBuilding size={16} />}
              onClick={() => navigate('/admin/projects')}
            >
              Create Project
            </Button>
            <Button 
              variant="outline"
              leftSection={<IconActivity size={16} />}
              onClick={() => navigate('/admin/health')}
            >
              System Status
            </Button>
          </Group>
        </Card>
      </Stack>
    </Document>
  );
} 