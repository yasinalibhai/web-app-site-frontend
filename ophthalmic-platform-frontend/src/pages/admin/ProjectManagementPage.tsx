import React, { useState } from 'react';
import { 
  Document, 
  useMedplum, 
  Loading, 
  useSearch,
  ResourceTable
} from '@medplum/react';
import { 
  Title, 
  Card, 
  Group, 
  Button, 
  TextInput, 
  Textarea, 
  Stack, 
  Text,
  Badge,
  Alert,
  Modal,
  Grid,
  Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconBuilding, IconUsers, IconAlertCircle } from '@tabler/icons-react';
import { Project, Organization } from '@medplum/fhirtypes';
import { showNotification } from '@mantine/notifications';

export function ProjectManagementPage(): React.JSX.Element {
  const medplum = useMedplum();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    organizationName: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  // Search for existing projects
  const [projectsBundle] = useSearch('Project', {
    _sort: '-_lastUpdated',
    _count: '20'
  });

  // Search for organizations
  const [orgsBundle] = useSearch('Organization', {
    _sort: 'name',
    _count: '50'
  });

  const projects = projectsBundle?.entry?.map(e => e.resource as Project) || [];
  const organizations = orgsBundle?.entry?.map(e => e.resource as Organization) || [];

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      showNotification({
        title: 'Error',
        message: 'Project name is required',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      // First create the organization if needed
      let organization: Organization | undefined;
      if (newProject.organizationName.trim()) {
        organization = await medplum.createResource<Organization>({
          resourceType: 'Organization',
          name: newProject.organizationName,
          telecom: [
            ...(newProject.contactEmail ? [{
              system: 'email' as const,
              value: newProject.contactEmail
            }] : []),
            ...(newProject.contactPhone ? [{
              system: 'phone' as const,
              value: newProject.contactPhone
            }] : [])
          ],
          address: newProject.address ? [{
            text: newProject.address
          }] : undefined
        });
      }

      // Create the project
      const project = await medplum.createResource<Project>({
        resourceType: 'Project',
        name: newProject.name,
        description: newProject.description || undefined,
        owner: organization ? {
          reference: `Organization/${organization.id}`,
          display: organization.name
        } : undefined
      });

      showNotification({
        title: 'Success',
        message: `Project "${project.name}" created successfully`,
        color: 'green'
      });

      // Reset form
      setNewProject({
        name: '',
        description: '',
        organizationName: '',
        contactEmail: '',
        contactPhone: '',
        address: ''
      });
      close();

      // Refresh the page
      window.location.reload();
    } catch (error: any) {
      console.error('Project creation error:', error);
      
      // Handle specific permission errors
      if (error.status === 403 || error.message?.includes('Forbidden')) {
        showNotification({
          title: 'Permission Error',
          message: 'You need server-level admin permissions to create projects. Please contact your system administrator.',
          color: 'red'
        });
      } else if (error.status === 401) {
        showNotification({
          title: 'Authentication Error', 
          message: 'Please log in again and try creating the project.',
          color: 'red'
        });
      } else {
        showNotification({
          title: 'Error',
          message: error.message || 'Failed to create project. Check console for details.',
          color: 'red'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatus = (project: Project): { color: string; label: string } => {
    // Simple heuristic based on last updated
    const lastUpdated = new Date(project.meta?.lastUpdated || project.meta?.versionId || Date.now());
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 7) return { color: 'green', label: 'Active' };
    if (daysSinceUpdate < 30) return { color: 'yellow', label: 'Recently Active' };
    return { color: 'gray', label: 'Inactive' };
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Document>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Project Management</Title>
            <Text c="dimmed">Manage hospital projects and site configurations</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Create New Project
          </Button>
        </Group>

        <Alert icon={<IconAlertCircle size={16} />} title="HIPAA Compliance Note" color="blue">
          Each project represents a separate hospital site with isolated data. Ensure proper access controls 
          are configured for each project before onboarding users.
        </Alert>

        <Alert icon={<IconAlertCircle size={16} />} title="Project Creation Requirements" color="orange">
          Creating new projects requires server-level administrator permissions. If you receive a "Forbidden" 
          error, contact your system administrator to grant the necessary privileges.
        </Alert>

        <Alert icon={<IconAlertCircle size={16} />} title="Testing Note" color="green">
          For testing the admin portal without server permissions, you can view and manage existing projects. 
          The project creation functionality will work once proper permissions are granted.
        </Alert>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card shadow="sm" padding="lg" withBorder>
              <Title order={3} mb="md">Existing Projects</Title>
              {projects.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No projects found. Create your first hospital project to get started.
                </Text>
              ) : (
                <Stack gap="md">
                  {projects.map((project) => {
                    const status = getProjectStatus(project);
                    return (
                      <Card key={project.id} shadow="xs" padding="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Group align="center" gap="sm">
                              <IconBuilding size={20} />
                              <Text fw={500} size="lg">{project.name}</Text>
                              <Badge color={status.color} size="sm">
                                {status.label}
                              </Badge>
                            </Group>
                            {project.description && (
                              <Text size="sm" c="dimmed" mt="xs">
                                {project.description}
                              </Text>
                            )}
                            <Group gap="lg" mt="sm">
                              <Text size="xs" c="dimmed">
                                ID: {project.id}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Created: {formatDate(project.meta?.lastUpdated)}
                              </Text>
                              {project.owner && (
                                <Text size="xs" c="dimmed">
                                  Owner: {project.owner.display}
                                </Text>
                              )}
                            </Group>
                          </div>
                          <Button 
                            variant="light" 
                            size="sm"
                            onClick={() => window.open(`/Project/${project.id}`, '_blank')}
                          >
                            View Details
                          </Button>
                        </Group>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" withBorder>
              <Title order={4} mb="md">Quick Stats</Title>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm">Total Projects</Text>
                  <Badge>{projects.length}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Active Projects</Text>
                  <Badge color="green">
                    {projects.filter(p => getProjectStatus(p).label === 'Active').length}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Organizations</Text>
                  <Badge color="blue">{organizations.length}</Badge>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title="Create New Hospital Project"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Project Name"
            placeholder="e.g., General Hospital - Site B"
            required
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          
          <Textarea
            label="Description"
            placeholder="Brief description of this hospital site..."
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            rows={3}
          />

          <TextInput
            label="Organization Name"
            placeholder="e.g., General Hospital System"
            value={newProject.organizationName}
            onChange={(e) => setNewProject({ ...newProject, organizationName: e.target.value })}
          />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Contact Email"
                placeholder="admin@hospital.com"
                type="email"
                value={newProject.contactEmail}
                onChange={(e) => setNewProject({ ...newProject, contactEmail: e.target.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Contact Phone"
                placeholder="+1 (555) 123-4567"
                value={newProject.contactPhone}
                onChange={(e) => setNewProject({ ...newProject, contactPhone: e.target.value })}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Address"
            placeholder="123 Medical Center Dr, City, State 12345"
            value={newProject.address}
            onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject} 
              loading={loading}
              leftSection={<IconPlus size={16} />}
            >
              Create Project
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Document>
  );
} 