import React, { useState } from 'react';
import { 
  Document, 
  useMedplum, 
  useSearch,
  ResourceTable
} from '@medplum/react';
import { 
  Title, 
  Card, 
  Group, 
  Button, 
  TextInput, 
  Stack, 
  Text,
  Badge,
  Alert,
  Modal,
  Grid,
  Select,
  Table,
  ActionIcon,
  Tabs
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconUsers, IconUserPlus, IconEdit, IconTrash, IconKey, IconAlertCircle } from '@tabler/icons-react';
import { User, ProjectMembership, AccessPolicy, Project, Practitioner } from '@medplum/fhirtypes';
import { showNotification } from '@mantine/notifications';

export function UserManagementPage(): React.JSX.Element {
  const medplum = useMedplum();
  const [inviteOpened, { open: openInvite, close: closeInvite }] = useDisclosure(false);
  const [membershipOpened, { open: openMembership, close: closeMembership }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newInvite, setNewInvite] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    projectId: ''
  });

  // Search for existing users
  const [usersBundle] = useSearch('User', {
    _sort: '-_lastUpdated',
    _count: '50'
  });

  // Search for projects
  const [projectsBundle] = useSearch('Project', {
    _sort: 'name',
    _count: '50'
  });

  // Search for access policies
  const [accessPoliciesBundle] = useSearch('AccessPolicy', {
    _sort: 'name',
    _count: '50'
  });

  // Search for project memberships
  const [membershipsBundle] = useSearch('ProjectMembership', {
    _sort: '-_lastUpdated',
    _count: '100'
  });

  const users = usersBundle?.entry?.map(e => e.resource as User) || [];
  const projects = projectsBundle?.entry?.map(e => e.resource as Project) || [];
  const accessPolicies = accessPoliciesBundle?.entry?.map(e => e.resource as AccessPolicy) || [];
  const memberships = membershipsBundle?.entry?.map(e => e.resource as ProjectMembership) || [];

  const handleInviteUser = async () => {
    if (!newInvite.email.trim() || !newInvite.firstName.trim() || !newInvite.lastName.trim()) {
      showNotification({
        title: 'Error',
        message: 'Email, first name, and last name are required',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      // Create practitioner first
      const practitioner = await medplum.createResource<Practitioner>({
        resourceType: 'Practitioner',
        name: [{
          given: [newInvite.firstName],
          family: newInvite.lastName
        }],
        telecom: [{
          system: 'email',
          value: newInvite.email
        }]
      });

      // Create user invite
      const response = await medplum.createResource<User>({
        resourceType: 'User',
        email: newInvite.email,
        firstName: newInvite.firstName,
        lastName: newInvite.lastName
      });

      // Create project membership if project and role are selected
      if (newInvite.projectId && newInvite.role) {
        try {
          // Validate that the project and access policy exist
          const selectedProject = projects.find(p => p.id === newInvite.projectId);
          const selectedPolicy = accessPolicies.find(p => p.id === newInvite.role);
          
          if (!selectedProject) {
            throw new Error(`Project with ID ${newInvite.projectId} not found`);
          }
          
          if (!selectedPolicy) {
            throw new Error(`Access Policy with ID ${newInvite.role} not found`);
          }

          console.log('=== ProjectMembership Creation Debug ===');
          console.log('Creating ProjectMembership with:', {
            userId: response.id,
            projectId: newInvite.projectId,
            projectName: selectedProject.name,
            accessPolicyId: newInvite.role,
            accessPolicyName: selectedPolicy.name,
            practitionerId: practitioner.id,
            currentUserProfile: medplum.getProfile(),
            currentUserId: medplum.getProfile()?.id
          });

          const membershipData = {
            resourceType: 'ProjectMembership' as const,
            project: {
              reference: `Project/${newInvite.projectId}`
            },
            user: {
              reference: `User/${response.id}`,
              display: `${newInvite.firstName} ${newInvite.lastName}`
            },
            profile: {
              reference: `Practitioner/${practitioner.id}`,
              display: `${newInvite.firstName} ${newInvite.lastName}`
            },
            accessPolicy: {
              reference: `AccessPolicy/${newInvite.role}`
            },
            invitedBy: {
              reference: `User/${medplum.getProfile()?.id}`,
              display: 'Admin User'
            }
          };

          console.log('ProjectMembership payload:', JSON.stringify(membershipData, null, 2));

          const membership = await medplum.createResource<ProjectMembership>(membershipData);

          console.log('✅ ProjectMembership created successfully:', membership);
          console.log('Membership ID:', membership.id);
          console.log('=== End ProjectMembership Debug ===');
          
          showNotification({
            title: 'Membership Created',
            message: `${newInvite.firstName} assigned to project successfully`,
            color: 'blue'
          });
        } catch (membershipError: any) {
          console.error('❌ ProjectMembership creation failed:');
          console.error('Error object:', membershipError);
          console.error('Error message:', membershipError.message);
          console.error('Error status:', membershipError.status);
          console.error('Error response:', membershipError.response);
          console.error('Full error details:', JSON.stringify(membershipError, null, 2));
          
          showNotification({
            title: 'Warning: Membership Failed',
            message: `User created but project assignment failed: ${membershipError.message}`,
            color: 'orange'
          });
        }
      } else {
        console.log('⚠️ Skipping ProjectMembership creation:', {
          hasProjectId: !!newInvite.projectId,
          hasRole: !!newInvite.role,
          projectId: newInvite.projectId,
          role: newInvite.role,
          projectIdType: typeof newInvite.projectId,
          roleType: typeof newInvite.role
        });
      }

      showNotification({
        title: 'Success',
        message: `User ${newInvite.firstName} ${newInvite.lastName} created successfully`,
        color: 'green'
      });

      // Reset form
      setNewInvite({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        projectId: ''
      });
      closeInvite();

      // Refresh the page
      window.location.reload();
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to send invitation',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserMemberships = (userId: string): ProjectMembership[] => {
    return memberships.filter(m => m.user?.reference === `User/${userId}`);
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const getAccessPolicyName = (policyId: string): string => {
    const policy = accessPolicies.find(p => p.id === policyId);
    return policy?.name || policyId;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getUserStatus = (user: User): { color: string; label: string } => {
    // Simple heuristic - if user has recent login activity or memberships
    const userMemberships = getUserMemberships(user.id || '');
    if (userMemberships.length > 0) return { color: 'green', label: 'Active' };
    return { color: 'gray', label: 'Pending' };
  };

  return (
    <Document>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>User Management</Title>
            <Text c="dimmed">Manage users, project memberships, and access policies</Text>
          </div>
          <Button leftSection={<IconUserPlus size={16} />} onClick={openInvite}>
            Invite User
          </Button>
        </Group>

        <Alert icon={<IconAlertCircle size={16} />} title="Access Control Reminder" color="blue">
          Always assign appropriate access policies and project memberships. Hospital staff should only 
          have access to their own project data.
        </Alert>

        {accessPolicies.length === 0 && (
          <Alert icon={<IconAlertCircle size={16} />} title="No Access Policies Found" color="orange">
            No access policies are available. Users can be created but cannot be assigned to projects 
            without access policies. Create access policies in the Medplum Admin interface first.
          </Alert>
        )}

        <Tabs defaultValue="users">
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              Users ({users.length})
            </Tabs.Tab>
            <Tabs.Tab value="memberships" leftSection={<IconKey size={16} />}>
              Project Memberships ({memberships.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="users" pt="md">
            <Card shadow="sm" padding="lg" withBorder>
              <Title order={3} mb="md">System Users</Title>
              {users.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No users found. Invite your first user to get started.
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Projects</Table.Th>
                      <Table.Th>Last Login</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => {
                      const status = getUserStatus(user);
                      const userMemberships = getUserMemberships(user.id || '');
                      return (
                        <Table.Tr key={user.id}>
                          <Table.Td>
                            <div>
                              <Text fw={500}>{user.firstName} {user.lastName}</Text>
                              <Text size="xs" c="dimmed">ID: {user.id}</Text>
                            </div>
                          </Table.Td>
                          <Table.Td>{user.email}</Table.Td>
                          <Table.Td>
                            <Badge color={status.color} size="sm">
                              {status.label}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              {userMemberships.length === 0 ? (
                                <Text size="sm" c="dimmed">No projects</Text>
                              ) : (
                                userMemberships.slice(0, 2).map((membership, idx) => (
                                  <Badge key={idx} variant="light" size="xs">
                                    {getProjectName(membership.project?.reference?.replace('Project/', '') || '')}
                                  </Badge>
                                ))
                              )}
                              {userMemberships.length > 2 && (
                                <Text size="xs" c="dimmed">+{userMemberships.length - 2} more</Text>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {formatDate(user.meta?.lastUpdated)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon 
                                variant="light" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  openMembership();
                                }}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon 
                                variant="light" 
                                color="blue" 
                                size="sm"
                                onClick={() => window.open(`/User/${user.id}`, '_blank')}
                              >
                                <IconUsers size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="memberships" pt="md">
            <Card shadow="sm" padding="lg" withBorder>
              <Title order={3} mb="md">Project Memberships</Title>
              {memberships.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No project memberships found.
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Project</Table.Th>
                      <Table.Th>Access Policy</Table.Th>
                      <Table.Th>Role</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {memberships.map((membership) => {
                      const user = users.find(u => u.id === membership.user?.reference?.replace('User/', ''));
                      return (
                        <Table.Tr key={membership.id}>
                          <Table.Td>
                            <div>
                              <Text fw={500}>
                                {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                              </Text>
                              <Text size="xs" c="dimmed">{user?.email}</Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500}>
                              {getProjectName(membership.project?.reference?.replace('Project/', '') || '')}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light">
                              {getAccessPolicyName(membership.accessPolicy?.reference?.replace('AccessPolicy/', '') || '')}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {membership.profile?.display || 'No role specified'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {formatDate(membership.meta?.lastUpdated)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon variant="light" size="sm">
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon 
                                variant="light" 
                                color="blue" 
                                size="sm"
                                onClick={() => window.open(`/ProjectMembership/${membership.id}`, '_blank')}
                              >
                                <IconKey size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Invite User Modal */}
      <Modal
        opened={inviteOpened}
        onClose={closeInvite}
        title="Invite New User"
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="First Name"
                placeholder="John"
                required
                value={newInvite.firstName}
                onChange={(e) => setNewInvite({ ...newInvite, firstName: e.target.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Last Name"
                placeholder="Doe"
                required
                value={newInvite.lastName}
                onChange={(e) => setNewInvite({ ...newInvite, lastName: e.target.value })}
              />
            </Grid.Col>
          </Grid>
          
          <TextInput
            label="Email Address"
            placeholder="user@hospital.com"
            type="email"
            required
            value={newInvite.email}
            onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
          />

          <Select
            label="Project"
            placeholder="Select a project"
            data={projects.map(p => ({ value: p.id || '', label: p.name || '' }))}
            value={newInvite.projectId}
            onChange={(value) => setNewInvite({ ...newInvite, projectId: value || '' })}
          />

          <Select
            label="Access Policy"
            placeholder={accessPolicies.length === 0 ? "No access policies available" : "Select an access policy"}
            disabled={accessPolicies.length === 0}
            data={accessPolicies.map(p => ({ value: p.id || '', label: p.name || '' }))}
            value={newInvite.role}
            onChange={(value) => setNewInvite({ ...newInvite, role: value || '' })}
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={closeInvite}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteUser} 
              loading={loading}
              leftSection={<IconUserPlus size={16} />}
            >
              Send Invitation
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Membership Modal - Placeholder */}
      <Modal
        opened={membershipOpened}
        onClose={closeMembership}
        title={`Edit Memberships - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        size="lg"
      >
        <Text c="dimmed" ta="center" py="xl">
          Membership editing functionality would be implemented here.
          This would allow adding/removing project memberships and updating access policies.
        </Text>
      </Modal>
    </Document>
  );
} 