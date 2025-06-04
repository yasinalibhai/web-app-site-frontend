import React, { useState, useCallback } from 'react';
import {
  Button,
  Group,
  Stack,
  Text,
  Title,
  Card,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Select,
  LoadingOverlay,
  Alert,
  ActionIcon,
  Table,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useMedplum, useSearch } from '@medplum/react';
import { ResearchStudy } from '@medplum/fhirtypes';

interface ResearchStudyFormData {
  title: string;
  description: string;
  status: string;
  phase?: string;
  sponsor?: string;
  principalInvestigator?: string;
}

export function ResearchStudyManagementPage(): React.JSX.Element {
  const medplum = useMedplum();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<ResearchStudy | null>(null);
  const [formData, setFormData] = useState<ResearchStudyFormData>({
    title: '',
    description: '',
    status: 'active',
    phase: '',
    sponsor: '',
    principalInvestigator: '',
  });

  // Fetch existing research studies
  const [studiesBundle, studiesLoading] = useSearch('ResearchStudy', {
    _sort: '-_lastUpdated',
    _count: 50,
  });

  const studies = studiesBundle?.entry?.map((entry) => entry.resource as ResearchStudy) || [];

  const handleCreateNew = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      status: 'active',
      phase: '',
      sponsor: '',
      principalInvestigator: '',
    });
    setSelectedStudy(null);
    setIsEditing(false);
    open();
  }, [open]);

  const handleEdit = useCallback((study: ResearchStudy) => {
    setFormData({
      title: study.title || '',
      description: study.description || '',
      status: study.status || 'active',
      phase: study.phase?.coding?.[0]?.code || '',
      sponsor: study.sponsor?.display || '',
      principalInvestigator: study.principalInvestigator?.display || '',
    });
    setSelectedStudy(study);
    setIsEditing(true);
    open();
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim()) {
      showNotification({
        title: 'Error',
        message: 'Study title is required',
        color: 'red',
      });
      return;
    }

    if (!formData.description.trim()) {
      showNotification({
        title: 'Error',
        message: 'Study description is required',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const studyData: ResearchStudy = {
        resourceType: 'ResearchStudy',
        title: formData.title,
        description: formData.description,
        status: formData.status as any,
        phase: formData.phase ? {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
            code: formData.phase,
            display: formData.phase.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }]
        } : undefined,
        sponsor: formData.sponsor ? { display: formData.sponsor } : undefined,
        principalInvestigator: formData.principalInvestigator ? { display: formData.principalInvestigator } : undefined,
      };

      if (isEditing && selectedStudy?.id) {
        await medplum.updateResource({ ...studyData, id: selectedStudy.id });
        showNotification({
          title: 'Success',
          message: 'Research study updated successfully',
          color: 'green',
        });
      } else {
        await medplum.createResource(studyData);
        showNotification({
          title: 'Success',
          message: 'Research study created successfully',
          color: 'green',
        });
      }

      close();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error saving research study:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to save research study',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [medplum, isEditing, selectedStudy, formData, close]);

  const handleDelete = useCallback(async (study: ResearchStudy) => {
    if (!study.id) return;
    
    if (!confirm(`Are you sure you want to delete the research study "${study.title}"?`)) {
      return;
    }

    try {
      await medplum.deleteResource('ResearchStudy', study.id);
      showNotification({
        title: 'Success',
        message: 'Research study deleted successfully',
        color: 'green',
      });
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error deleting research study:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete research study',
        color: 'red',
      });
    }
  }, [medplum]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'blue';
      case 'withdrawn': return 'red';
      case 'temporarily-closed-to-accrual': return 'yellow';
      default: return 'gray';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Stack gap="md" p="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Research Study Management</Title>
          <Text c="dimmed">Manage research studies that participating hospital sites can enroll patients into</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateNew}>
          Create New Study
        </Button>
      </Group>

      <Card withBorder>
        <Stack gap="sm">
          {studiesLoading && <LoadingOverlay visible />}
          
          {studies.length === 0 && !studiesLoading && (
            <Alert icon={<IconAlertCircle size={16} />} title="No Research Studies">
              No research studies have been created yet. Click "Create New Study" to get started.
            </Alert>
          )}

          {studies.length > 0 && (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Phase</Table.Th>
                  <Table.Th>Sponsor</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {studies.map((study) => (
                  <Table.Tr key={study.id}>
                    <Table.Td>
                      <Text fw={500}>{study.title}</Text>
                      {study.description && (
                        <Text size="sm" c="dimmed" truncate="end" maw={300}>
                          {study.description}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(study.status || 'unknown')} size="sm">
                        {study.status?.replace(/-/g, ' ').toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {study.phase?.coding?.[0]?.display || 'N/A'}
                    </Table.Td>
                    <Table.Td>
                      {study.sponsor?.display || 'N/A'}
                    </Table.Td>
                    <Table.Td>
                      {formatDate(study.meta?.lastUpdated)}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => handleEdit(study)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(study)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title={isEditing ? 'Edit Research Study' : 'Create New Research Study'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Study Title"
            placeholder="Enter study title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          
          <Textarea
            label="Description"
            placeholder="Enter study description"
            required
            minRows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          
          <Group grow>
            <Select
              label="Status"
              required
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value || 'active' })}
              data={[
                { value: 'active', label: 'Active' },
                { value: 'administratively-completed', label: 'Administratively Completed' },
                { value: 'approved', label: 'Approved' },
                { value: 'closed-to-accrual', label: 'Closed to Accrual' },
                { value: 'completed', label: 'Completed' },
                { value: 'in-review', label: 'In Review' },
                { value: 'temporarily-closed-to-accrual', label: 'Temporarily Closed to Accrual' },
                { value: 'withdrawn', label: 'Withdrawn' },
              ]}
            />
            
            <Select
              label="Phase"
              placeholder="Select phase (optional)"
              clearable
              value={formData.phase}
              onChange={(value) => setFormData({ ...formData, phase: value || '' })}
              data={[
                { value: 'early-phase-1', label: 'Early Phase 1' },
                { value: 'phase-1', label: 'Phase 1' },
                { value: 'phase-1-phase-2', label: 'Phase 1/Phase 2' },
                { value: 'phase-2', label: 'Phase 2' },
                { value: 'phase-2-phase-3', label: 'Phase 2/Phase 3' },
                { value: 'phase-3', label: 'Phase 3' },
                { value: 'phase-4', label: 'Phase 4' },
                { value: 'not-applicable', label: 'Not Applicable' },
              ]}
            />
          </Group>
          
          <Group grow>
            <TextInput
              label="Sponsor"
              placeholder="Sponsoring organization"
              value={formData.sponsor}
              onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
            />
            
            <TextInput
              label="Principal Investigator"
              placeholder="Principal investigator name"
              value={formData.principalInvestigator}
              onChange={(e) => setFormData({ ...formData, principalInvestigator: e.target.value })}
            />
          </Group>
          
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {isEditing ? 'Update Study' : 'Create Study'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
} 