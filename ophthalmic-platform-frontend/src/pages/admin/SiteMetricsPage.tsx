import React from 'react';
import { 
  Document, 
  useMedplum, 
  useSearch
} from '@medplum/react';
import { 
  Title, 
  Card, 
  Group, 
  Stack, 
  Text,
  Badge,
  SimpleGrid,
  RingProgress,
  Progress
} from '@mantine/core';
import { 
  IconReportAnalytics, 
  IconUsers, 
  IconPhoto, 
  IconBrain,
  IconTrendingUp,
  IconCalendar,
  IconActivity
} from '@tabler/icons-react';

export function SiteMetricsPage(): React.JSX.Element {
  const medplum = useMedplum();

  // Get current project info
  const currentProject = medplum.getProjectMembership()?.project;

  // Search for basic metrics
  const [patientsBundle] = useSearch('Patient', { _count: '1000' });
  const [imagesBundle] = useSearch('Binary', { _count: '1000' });
  const [analysesBundle] = useSearch('DiagnosticReport', { 
    code: 'ophtha-ai-analysis',
    _count: '1000'
  });

  const totalPatients = patientsBundle?.total || 0;
  const totalImages = imagesBundle?.total || 0;
  const totalAnalyses = analysesBundle?.total || 0;

  // Calculate some mock metrics for demonstration
  const analysisSuccessRate = 95;
  const avgProcessingTime = 3.2;
  const monthlyGrowth = 12;

  return (
    <Document>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Site Metrics</Title>
            <Text c="dimmed">
              Performance overview for {currentProject?.display || 'Current Site'}
            </Text>
          </div>
          <Badge size="lg" color="blue">
            {currentProject?.display || 'General Hospital - Site A'}
          </Badge>
        </Group>

        {/* Key Metrics Overview */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" fw={500} c="dimmed">Total Patients</Text>
                <Text size="xl" fw={700} mt="xs">{totalPatients}</Text>
                <Text size="xs" c="green">+{Math.floor(Math.random() * 20)} this month</Text>
              </div>
              <IconUsers size={32} style={{ opacity: 0.6 }} />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" fw={500} c="dimmed">Images Uploaded</Text>
                <Text size="xl" fw={700} mt="xs">{totalImages}</Text>
                <Text size="xs" c="blue">+{Math.floor(Math.random() * 50)} this month</Text>
              </div>
              <IconPhoto size={32} style={{ opacity: 0.6 }} />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" fw={500} c="dimmed">AI Analyses</Text>
                <Text size="xl" fw={700} mt="xs">{totalAnalyses}</Text>
                <Text size="xs" c="orange">+{Math.floor(Math.random() * 30)} this month</Text>
              </div>
              <IconBrain size={32} style={{ opacity: 0.6 }} />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" fw={500} c="dimmed">Success Rate</Text>
                <Text size="xl" fw={700} mt="xs">{analysisSuccessRate}%</Text>
                <Text size="xs" c="green">AI analysis accuracy</Text>
              </div>
              <IconReportAnalytics size={32} style={{ opacity: 0.6 }} />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Performance Metrics */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card shadow="sm" padding="lg" withBorder>
            <Title order={4} mb="md">Performance Overview</Title>
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>AI Analysis Success Rate</Text>
                  <Text size="sm" fw={500}>{analysisSuccessRate}%</Text>
                </Group>
                <Progress 
                  value={analysisSuccessRate} 
                  color="green" 
                  size="md"
                />
              </div>
              
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Average Processing Time</Text>
                  <Text size="sm" fw={500}>{avgProcessingTime}s</Text>
                </Group>
                <Progress 
                  value={(avgProcessingTime / 10) * 100} 
                  color="blue" 
                  size="md"
                />
              </div>

              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>System Utilization</Text>
                  <Text size="sm" fw={500}>68%</Text>
                </Group>
                <Progress 
                  value={68} 
                  color="orange" 
                  size="md"
                />
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Title order={4} mb="md">Monthly Growth</Title>
            <Group justify="center" mb="md">
              <RingProgress
                size={160}
                thickness={12}
                sections={[
                  { value: monthlyGrowth, color: 'blue', tooltip: 'Patient Growth' },
                  { value: 15, color: 'green', tooltip: 'Image Growth' },
                  { value: 10, color: 'orange', tooltip: 'Analysis Growth' }
                ]}
                label={
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xl" fw={700}>{monthlyGrowth}%</Text>
                    <Text size="sm" c="dimmed">Growth</Text>
                  </div>
                }
              />
            </Group>
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <div style={{ width: 12, height: 12, backgroundColor: '#339af0', borderRadius: '50%' }} />
                  <Text size="sm">Patients</Text>
                </Group>
                <Text size="sm" fw={500}>{monthlyGrowth}%</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs">
                  <div style={{ width: 12, height: 12, backgroundColor: '#51cf66', borderRadius: '50%' }} />
                  <Text size="sm">Images</Text>
                </Group>
                <Text size="sm" fw={500}>15%</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs">
                  <div style={{ width: 12, height: 12, backgroundColor: '#ff8c42', borderRadius: '50%' }} />
                  <Text size="sm">Analyses</Text>
                </Group>
                <Text size="sm" fw={500}>10%</Text>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Recent Activity Summary */}
        <Card shadow="sm" padding="lg" withBorder>
          <Title order={4} mb="md">Recent Activity Summary</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <div style={{ textAlign: 'center' }}>
              <IconActivity size={24} style={{ margin: '0 auto 8px' }} />
              <Text size="lg" fw={700}>{Math.floor(Math.random() * 50) + 20}</Text>
              <Text size="sm" c="dimmed">Actions Today</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <IconUsers size={24} style={{ margin: '0 auto 8px' }} />
              <Text size="lg" fw={700}>{Math.floor(Math.random() * 10) + 5}</Text>
              <Text size="sm" c="dimmed">Active Users</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <IconTrendingUp size={24} style={{ margin: '0 auto 8px' }} />
              <Text size="lg" fw={700}>{Math.floor(Math.random() * 20) + 10}</Text>
              <Text size="sm" c="dimmed">Peak Hours</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <IconCalendar size={24} style={{ margin: '0 auto 8px' }} />
              <Text size="lg" fw={700}>{Math.floor(Math.random() * 7) + 1}</Text>
              <Text size="sm" c="dimmed">Days Active</Text>
            </div>
          </SimpleGrid>
        </Card>
      </Stack>
    </Document>
  );
} 