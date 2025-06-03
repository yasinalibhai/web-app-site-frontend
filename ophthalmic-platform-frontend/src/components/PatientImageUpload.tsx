import { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { Button, FileInput, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { JSX, useState } from 'react';

interface PatientImageUploadProps {
  patient: Patient;
  onUploadComplete?: () => void;
}

export function PatientImageUpload({ patient, onUploadComplete }: PatientImageUploadProps): JSX.Element {
  const medplum = useMedplum();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    if (!imageFile) {
      showNotification({
        color: 'red',
        title: 'Missing file',
        message: 'Please choose an image file.',
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
          reference: `Patient/${patient.id}`,
          display: getPatientDisplayName(patient),
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
        message: `Image uploaded successfully for ${getPatientDisplayName(patient)}`,
      });

      // Reset form
      setImageFile(null);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
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
    <Paper p="md" shadow="xs" withBorder>
      <Stack gap="md">
        <Title order={4}>Upload New Image</Title>
        <Text size="sm" c="dimmed">
          Upload a JPEG, PNG, or DICOM ophthalmic image (max 50MB).
        </Text>
        <FileInput
          placeholder="Click to select image file"
          leftSection={<IconUpload size={14} />}
          accept="image/jpeg,image/png,image/dicom,application/dicom"
          value={imageFile}
          onChange={handleFileChange}
        />
        <Group justify="flex-end">
          <Button
            leftSection={<IconUpload />}
            onClick={handleUpload}
            loading={uploading}
            disabled={!imageFile}
          >
            Upload Image
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
} 