import { Patient } from '@medplum/fhirtypes';
import { Document, ResourceName, SearchControl, useMedplum, SearchClickEvent } from '@medplum/react';
import { Button, FileInput, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { JSX, useState } from 'react';

export function ImageUploadPage(): JSX.Element {
  const medplum = useMedplum();
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePatientSelect = (e: SearchClickEvent): void => {
    if (e.resource.resourceType === 'Patient') {
      setSelectedPatient(e.resource as Patient);
    }
  };

  const handleFileChange = (file: File | null): void => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom'];
      if (!validTypes.includes(file.type)) {
        showNotification({
          color: 'red',
          title: 'Invalid file type',
          message: 'Please upload a JPEG, PNG, or DICOM image.',
        });
        return;
      }

      // Validate file size (e.g., max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        showNotification({
          color: 'red',
          title: 'File too large',
          message: 'Please upload an image smaller than 50MB.',
        });
        return;
      }

      setImageFile(file);
    }
  };

  const getPatientDisplayName = (patient: Patient): string => {
    if (patient.name && patient.name.length > 0) {
      const name = patient.name[0];
      const parts = [];
      if (name.given) parts.push(...name.given);
      if (name.family) parts.push(name.family);
      return parts.join(' ');
    }
    return 'Patient';
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedPatient || !imageFile) {
      showNotification({
        color: 'red',
        title: 'Missing information',
        message: 'Please select a patient and choose an image file.',
      });
      return;
    }

    setUploading(true);
    try {
      // Step 1: Create a Binary resource with the image
      const binary = await medplum.createBinary(imageFile, imageFile.name, imageFile.type);

      // Step 2: Create a Media resource to link the image to the patient
      const media = await medplum.createResource({
        resourceType: 'Media',
        status: 'completed',
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/media-type',
              code: 'image',
              display: 'Image',
            },
          ],
          text: 'Ophthalmic Image',
        },
        subject: {
          reference: `Patient/${selectedPatient.id}`,
          display: getPatientDisplayName(selectedPatient),
        },
        createdDateTime: new Date().toISOString(),
        content: {
          contentType: imageFile.type,
          url: `Binary/${binary.id}`,
          title: imageFile.name,
        },
        note: [
          {
            text: `Ophthalmic image uploaded via MyOphtha platform`,
          },
        ],
      });

      showNotification({
        color: 'green',
        title: 'Upload successful',
        message: `Image uploaded successfully for ${getPatientDisplayName(selectedPatient)}`,
      });

      // Reset form
      setImageFile(null);
      setSelectedPatient(undefined);
    } catch (error) {
      console.error('Upload error:', error);
      showNotification({
        color: 'red',
        title: 'Upload failed',
        message: 'Failed to upload image. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Document>
      <Title order={1}>Upload Ophthalmic Image</Title>
      <Stack gap="lg" mt="md">
        <Paper p="md" shadow="xs">
          <Stack gap="md">
            <div>
              <Title order={3}>Step 1: Select Patient</Title>
              <Text size="sm" c="dimmed">
                Search for and select the patient for whom you want to upload an image.
              </Text>
              <SearchControl
                search={{
                  resourceType: 'Patient',
                  fields: ['name', 'birthdate', 'identifier'],
                }}
                onClick={handlePatientSelect}
                onChange={() => setSelectedPatient(undefined)}
                hideFilters
                hideToolbar
              />
              {selectedPatient && (
                <Paper p="sm" mt="sm" withBorder>
                  <Text size="sm">
                    Selected: <strong><ResourceName value={selectedPatient} /></strong>
                  </Text>
                </Paper>
              )}
            </div>

            <div>
              <Title order={3}>Step 2: Choose Image File</Title>
              <Text size="sm" c="dimmed" mb="sm">
                Upload a JPEG, PNG, or DICOM ophthalmic image (max 50MB).
              </Text>
              <FileInput
                placeholder="Click to select image file"
                leftSection={<IconUpload size={14} />}
                accept="image/jpeg,image/png,image/dicom,application/dicom"
                value={imageFile}
                onChange={handleFileChange}
              />
            </div>

            <Group justify="flex-end">
              <Button
                leftSection={<IconUpload />}
                onClick={handleUpload}
                loading={uploading}
                disabled={!selectedPatient || !imageFile}
              >
                Upload Image
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Document>
  );
} 