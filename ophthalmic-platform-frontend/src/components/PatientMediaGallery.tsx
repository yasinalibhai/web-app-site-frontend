import { Media, BundleEntry } from '@medplum/fhirtypes';
import { useSearch } from '@medplum/react';
import { Card, Text, Stack, Title, ScrollArea, Group, Badge, Box, LoadingOverlay, Alert } from '@mantine/core';
import { IconPhoto, IconClock, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { JSX } from 'react';

interface PatientMediaGalleryProps {
  patientId: string;
  selectedMediaId?: string;
  onMediaSelect: (media: Media) => void;
  analyzing?: string | null; // Media ID being analyzed
  analysisResults?: Map<string, boolean>; // Map of media ID to whether it has been analyzed
}

export function PatientMediaGallery({ 
  patientId, 
  selectedMediaId, 
  onMediaSelect, 
  analyzing,
  analysisResults 
}: PatientMediaGalleryProps): JSX.Element {
  // Search for patient's Media resources (uploaded images)
  const [mediaBundle, mediaLoading] = useSearch('Media', {
    subject: `Patient/${patientId}`,
    _sort: '-_lastUpdated'
  });

  const mediaResources = mediaBundle?.entry?.map((entry: BundleEntry<Media>) => entry.resource as Media) || [];
  const ophthalmicImages = mediaResources.filter((media: Media) => 
    media.type?.text?.toLowerCase().includes('ophthalmic') && 
    media.content.contentType?.startsWith('image/')
  );

  const getAnalysisStatus = (media: Media): 'pending' | 'analyzed' | 'none' => {
    if (analyzing === media.id) return 'pending';
    if (analysisResults?.get(media.id || '')) return 'analyzed';
    return 'none';
  };

  const getStatusBadge = (status: 'pending' | 'analyzed' | 'none'): JSX.Element => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" size="sm" leftSection={<IconClock size={10} />}>Analyzing</Badge>;
      case 'analyzed':
        return <Badge color="green" size="sm" leftSection={<IconCheck size={10} />}>Analyzed</Badge>;
      case 'none':
        return <Badge color="gray" size="sm" leftSection={<IconAlertTriangle size={10} />}>Pending</Badge>;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (mediaLoading) {
    return (
      <Box pos="relative" h={400}>
        <LoadingOverlay visible={true} />
      </Box>
    );
  }

  return (
    <Stack gap="md">
      <Title order={4}>Patient Images ({ophthalmicImages.length})</Title>
      
      {ophthalmicImages.length === 0 ? (
        <Alert>
          No ophthalmic images found for this patient. Upload images to get started.
        </Alert>
      ) : (
        <ScrollArea h={400}>
          <Stack gap="sm">
            {ophthalmicImages.map((media: Media) => {
              const isSelected = selectedMediaId === media.id;
              const status = getAnalysisStatus(media);
              
              return (
                <Card 
                  key={media.id} 
                  shadow="sm" 
                  p="sm" 
                  withBorder
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                    borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined
                  }}
                  onClick={() => onMediaSelect(media)}
                >
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <IconPhoto size={16} />
                        <Text fw={500} size="sm" lineClamp={1}>
                          {media.content.title || 'Ophthalmic Image'}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        Uploaded: {formatDate(media.createdDateTime)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Type: {media.content.contentType}
                      </Text>
                    </div>
                    <div>
                      {getStatusBadge(status)}
                    </div>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  );
} 