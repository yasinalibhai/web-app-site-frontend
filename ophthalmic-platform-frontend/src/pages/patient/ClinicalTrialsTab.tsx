import React, { useState, useCallback } from 'react';
import {
  Stack,
  Title,
  Card,
  Text,
  Button,
  Group,
  Badge,
  Alert,
  Modal,
  Select,
  Textarea,
  Table,
  ActionIcon,
  LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import {
  IconPlus,
  IconEye,
  IconEdit,
  IconUserCheck,
  IconUserX,
  IconAlertCircle,
  IconFlask,
} from '@tabler/icons-react';
import { useMedplum, useSearch } from '@medplum/react';
import { ResearchStudy, ResearchSubject, Patient } from '@medplum/fhirtypes';
import { usePatient } from '../../hooks/usePatient';

interface EnrollmentFormData {
  studyId: string;
  status: string;
  consent?: string;
  notes?: string;
}

export function ClinicalTrialsTab(): React.JSX.Element {
  const medplum = useMedplum();
  const patient = usePatient();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<ResearchStudy | null>(null);
  const [formData, setFormData] = useState<EnrollmentFormData>({
    studyId: '',
    status: 'candidate',
    consent: '',
    notes: '',
  });

  // Fetch available research studies
  const [studiesBundle, studiesLoading] = useSearch('ResearchStudy', {
    status: 'active',
    _sort: '-_lastUpdated',
    _count: 50,
  });

  // Fetch existing enrollments for this patient
  const [enrollmentsBundle, enrollmentsLoading] = useSearch('ResearchSubject', {
    individual: `Patient/${patient?.id}`,
    _sort: '-_lastUpdated',
    _count: 20,
  });

  const availableStudies = studiesBundle?.entry?.map((entry) => entry.resource as ResearchStudy) || [];
  const currentEnrollments = enrollmentsBundle?.entry?.map((entry) => entry.resource as ResearchSubject) || [];

  const handleEnrollPatient = useCallback((study: ResearchStudy) => {
    setSelectedStudy(study);
    setFormData({
      studyId: study.id || '',
      status: 'candidate',
      consent: '',
      notes: '',
    });
    open();
  }, [open]);

  const handleSubmitEnrollment = useCallback(async () => {
    if (!patient?.id || !selectedStudy?.id) {
      showNotification({
        title: 'Error',
        message: 'Patient or study information is missing',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const researchSubject: ResearchSubject = {
        resourceType: 'ResearchSubject',
        status: formData.status as any,
        study: {
          reference: `ResearchStudy/${selectedStudy.id}`,
          display: selectedStudy.title,
        },
        individual: {
          reference: `Patient/${patient.id}`,
          display: patient.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Unknown Patient',
        },
        period: {
          start: new Date().toISOString(),
        },
      };

      // Note: Consent details can be stored in notes or as separate Consent resources
      // For now, we'll handle consent information in a future enhancement

      await medplum.createResource(researchSubject);

      showNotification({
        title: 'Success',
        message: `Patient enrolled in study: ${selectedStudy.title}`,
        color: 'green',
      });

      close();
      // Refresh enrollments
      window.location.reload();
    } catch (error) {
      console.error('Error enrolling patient:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to enroll patient in study',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [medplum, patient, selectedStudy, formData, close]);

  const handleUpdateEnrollmentStatus = useCallback(async (enrollment: ResearchSubject, newStatus: string) => {
    if (!enrollment.id) return;

    try {
      const updatedEnrollment = {
        ...enrollment,
        status: newStatus as any,
      };

      if (newStatus === 'off-study' && enrollment.period) {
        updatedEnrollment.period = {
          ...enrollment.period,
          end: new Date().toISOString(),
        };
      }

      await medplum.updateResource(updatedEnrollment);

      showNotification({
        title: 'Success',
        message: 'Enrollment status updated successfully',
        color: 'green',
      });

      // Refresh enrollments
      window.location.reload();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update enrollment status',
        color: 'red',
      });
    }
  }, [medplum]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'green';
      case 'candidate': return 'blue';
      case 'eligible': return 'teal';
      case 'off-study': return 'red';
      case 'withdrawn': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter out studies the patient is already enrolled in
  const enrolledStudyIds = new Set(currentEnrollments.map(e => e.study?.reference?.split('/')[1]));
  const availableForEnrollment = availableStudies.filter(study => !enrolledStudyIds.has(study.id));

  if (!patient) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="No Patient Selected">
        Please select a patient to view clinical trial information.
      </Alert>
    );
  }

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <div>
          <Title order={3}>Clinical Trial Enrollment</Title>
          <Text c="dimmed">Manage patient enrollment in research studies</Text>
        </div>
      </Group>

      {/* Current Enrollments */}
      <Card withBorder>
        <Title order={4} mb="md">Current Enrollments</Title>
        
        {enrollmentsLoading && <LoadingOverlay visible />}
        
        {currentEnrollments.length === 0 && !enrollmentsLoading && (
          <Alert icon={<IconAlertCircle size={16} />} title="No Active Enrollments">
            This patient is not currently enrolled in any research studies.
          </Alert>
        )}

        {currentEnrollments.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Study</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Enrolled Date</Table.Th>
                <Table.Th>End Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentEnrollments.map((enrollment) => (
                <Table.Tr key={enrollment.id}>
                  <Table.Td>
                    <Text fw={500}>{enrollment.study?.display || 'Unknown Study'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(enrollment.status || 'unknown')} size="sm">
                      {enrollment.status?.replace(/-/g, ' ').toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDate(enrollment.period?.start)}</Table.Td>
                  <Table.Td>{formatDate(enrollment.period?.end)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {enrollment.status !== 'off-study' && enrollment.status !== 'withdrawn' && (
                        <>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="green"
                            title="Mark as Enrolled"
                            onClick={() => handleUpdateEnrollmentStatus(enrollment, 'enrolled')}
                          >
                            <IconUserCheck size={16} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            title="Mark as Off Study"
                            onClick={() => handleUpdateEnrollmentStatus(enrollment, 'off-study')}
                          >
                            <IconUserX size={16} />
                          </ActionIcon>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Available Studies */}
      <Card withBorder>
        <Title order={4} mb="md">Available Research Studies</Title>
        
        {studiesLoading && <LoadingOverlay visible />}
        
        {availableForEnrollment.length === 0 && !studiesLoading && (
          <Alert icon={<IconFlask size={16} />} title="No Available Studies">
            {availableStudies.length === 0 
              ? "No active research studies are currently available."
              : "This patient is already enrolled in all available studies."
            }
          </Alert>
        )}

        {availableForEnrollment.length > 0 && (
          <Stack gap="md">
            {availableForEnrollment.map((study) => (
              <Card key={study.id} shadow="xs" padding="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group align="center" gap="sm" mb="xs">
                      <IconFlask size={20} />
                      <Text fw={500} size="lg">{study.title}</Text>
                      <Badge color="blue" size="sm">
                        {study.phase?.coding?.[0]?.display || 'Phase Unknown'}
                      </Badge>
                    </Group>
                    
                    {study.description && (
                      <Text size="sm" c="dimmed" mb="sm">
                        {study.description}
                      </Text>
                    )}
                    
                    <Group gap="lg">
                      {study.sponsor && (
                        <Text size="xs" c="dimmed">
                          Sponsor: {study.sponsor.display}
                        </Text>
                      )}
                      {study.principalInvestigator && (
                        <Text size="xs" c="dimmed">
                          PI: {study.principalInvestigator.display}
                        </Text>
                      )}
                    </Group>
                  </div>
                  
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => handleEnrollPatient(study)}
                    size="sm"
                  >
                    Enroll Patient
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Card>

      {/* Enrollment Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={`Enroll Patient in: ${selectedStudy?.title}`}
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} title="Patient Information">
            <Text size="sm">
              Patient: {patient.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Unknown'}
            </Text>
            <Text size="sm">ID: {patient.id}</Text>
          </Alert>

          <Select
            label="Initial Status"
            required
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value || 'candidate' })}
            data={[
              { value: 'candidate', label: 'Candidate' },
              { value: 'eligible', label: 'Eligible' },
              { value: 'enrolled', label: 'Enrolled' },
            ]}
          />

          <Textarea
            label="Consent Information (Optional)"
            placeholder="Enter consent details or reference..."
            value={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.value })}
            rows={2}
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Any additional notes about this enrollment..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEnrollment} loading={loading}>
              Enroll Patient
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
} 