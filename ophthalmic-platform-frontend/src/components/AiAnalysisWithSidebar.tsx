import { Media, DiagnosticReport, BundleEntry, Patient } from '@medplum/fhirtypes';
import { useSearch } from '@medplum/react';
import { Grid, Stack, Title, Alert } from '@mantine/core';
import { JSX, useState } from 'react';
import { PatientMediaGallery } from './PatientMediaGallery';
import { PatientImageUpload } from './PatientImageUpload';
import { SelectedImageAnalysis } from './SelectedImageAnalysis';

interface AiAnalysisWithSidebarProps {
  patientId: string;
  patient: Patient;
}

export function AiAnalysisWithSidebar({ patientId, patient }: AiAnalysisWithSidebarProps): JSX.Element {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  // Search for existing AI analysis reports to track which images have been analyzed
  const [diagnosticReportsBundle] = useSearch('DiagnosticReport', {
    subject: `Patient/${patientId}`,
    code: 'ai-ophthalmic-analysis',
    _sort: '-_lastUpdated'
  });

  // Create a map of media IDs to whether they have been analyzed
  const analysisResults = new Map<string, boolean>();
  diagnosticReportsBundle?.entry?.forEach((entry: BundleEntry<DiagnosticReport>) => {
    const report = entry.resource as DiagnosticReport;
    report.media?.forEach(media => {
      const mediaId = media.link?.reference?.replace('Media/', '');
      if (mediaId) {
        analysisResults.set(mediaId, true);
      }
    });
  });

  const handleMediaSelect = (media: Media): void => {
    setSelectedMedia(media);
  };

  const handleUploadComplete = (): void => {
    // This will trigger a re-render and refresh the media gallery
    // The useSearch hook will automatically fetch new media
  };

  const handleAnalysisComplete = (): void => {
    // This will trigger a re-render and refresh the analysis status
    // The useSearch hooks will automatically fetch new diagnostic reports
    setAnalyzing(null);
  };

  const handleAnalysisStart = (mediaId: string): void => {
    setAnalyzing(mediaId);
  };

  return (
    <div>
      <Title order={2} mb="lg">AI Image Analysis</Title>
      
      <Grid gutter="lg">
        {/* Left Sidebar */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            {/* Media Gallery */}
            <PatientMediaGallery
              patientId={patientId}
              selectedMediaId={selectedMedia?.id}
              onMediaSelect={handleMediaSelect}
              analyzing={analyzing}
              analysisResults={analysisResults}
            />
            
            {/* Image Upload */}
            <PatientImageUpload
              patient={patient}
              onUploadComplete={handleUploadComplete}
            />
          </Stack>
        </Grid.Col>

        {/* Main Content Area */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          {selectedMedia ? (
            <SelectedImageAnalysis
              media={selectedMedia}
              patientId={patientId}
              onAnalysisComplete={handleAnalysisComplete}
            />
          ) : (
            <Alert>
              Select an image from the gallery on the left to view its details and perform AI analysis.
            </Alert>
          )}
        </Grid.Col>
      </Grid>
    </div>
  );
} 