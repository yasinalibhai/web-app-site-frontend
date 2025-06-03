import { Media, DiagnosticReport, Observation, Bundle, BundleEntry } from '@medplum/fhirtypes';
import { useMedplum, ResourceTable, useSearch } from '@medplum/react';
import { Button, Card, Group, Text, Title, Badge, Stack, Loader, Alert } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconBrain, IconCheck, IconAlertTriangle, IconClock } from '@tabler/icons-react';
import { JSX, useState } from 'react';
import { MockAiService } from '../services/mockAiService';

interface AiAnalysisControlProps {
  patientId: string;
}

export function AiAnalysisControl({ patientId }: AiAnalysisControlProps): JSX.Element {
  const medplum = useMedplum();
  const [analyzing, setAnalyzing] = useState<string | null>(null); // Media ID being analyzed

  // Search for patient's Media resources (uploaded images)
  const [mediaBundle, mediaLoading] = useSearch('Media', {
    subject: `Patient/${patientId}`,
    _sort: '-_lastUpdated'
  });

  // Search for existing AI analysis reports for this patient
  const [diagnosticReportsBundle, diagnosticReportsLoading] = useSearch('DiagnosticReport', {
    subject: `Patient/${patientId}`,
    code: 'ai-ophthalmic-analysis',
    _sort: '-_lastUpdated'
  });

  const handleAnalyzeImage = async (media: Media): Promise<void> => {
    if (!media.id || !media.content.url) {
      showNotification({
        color: 'red',
        title: 'Error',
        message: 'Invalid media resource'
      });
      return;
    }

    setAnalyzing(media.id);

    try {
      // Extract imageId from the Binary URL
      const imageId = media.content.url.replace('Binary/', '');
      
      // Call mock AI service to analyze the image
      const analysisResult = await MockAiService.analyzeImage(imageId, patientId);
      
      // Create Observation resources for each biomarker
      const observations: Observation[] = [];
      for (const biomarker of analysisResult.biomarkers) {
        const observation: Observation = {
          resourceType: 'Observation',
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'imaging',
                  display: 'Imaging'
                }
              ]
            }
          ],
          code: {
            text: biomarker.name,
            coding: [
              {
                system: 'http://local-ophtha-system.com/biomarkers',
                code: biomarker.name.toLowerCase().replace(/\s+/g, '-'),
                display: biomarker.name
              }
            ]
          },
          subject: { reference: `Patient/${patientId}` },
          effectiveDateTime: analysisResult.timestamp,
          valueQuantity: {
            value: Math.round(biomarker.value * 100) / 100,
            unit: biomarker.unit,
            system: 'http://unitsofmeasure.org'
          },
          interpretation: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: biomarker.category === 'normal' ? 'N' : 
                        biomarker.category === 'abnormal' ? 'A' : 'I',
                  display: biomarker.category === 'normal' ? 'Normal' : 
                          biomarker.category === 'abnormal' ? 'Abnormal' : 'Intermediate'
                }
              ]
            }
          ],
          note: [
            {
              text: `AI confidence: ${Math.round(biomarker.confidence * 100)}%`
            }
          ],
          derivedFrom: [
            {
              reference: `Media/${media.id}`,
              display: 'Source ophthalmic image'
            }
          ],
          extension: [
            {
              url: 'http://local-ophtha-system.com/ai-analysis-id',
              valueString: analysisResult.analysisId
            },
            {
              url: 'http://local-ophtha-system.com/ai-model-version',
              valueString: analysisResult.modelVersion
            }
          ]
        };

        const createdObservation = await medplum.createResource(observation);
        observations.push(createdObservation);
      }

      // Create DiagnosticReport summarizing the findings
      const diagnosticReport: DiagnosticReport = {
        resourceType: 'DiagnosticReport',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'IMG',
                display: 'Diagnostic Imaging'
              }
            ]
          }
        ],
        code: {
          text: 'AI Ophthalmic Image Analysis',
          coding: [
            {
              system: 'http://local-ophtha-system.com/procedures',
              code: 'ai-ophthalmic-analysis',
              display: 'AI Ophthalmic Image Analysis'
            }
          ]
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: analysisResult.timestamp,
        issued: analysisResult.timestamp,
        performer: [
          {
            display: `${analysisResult.modelVersion} AI System`
          }
        ],
        result: observations.map(obs => ({
          reference: `Observation/${obs.id}`,
          display: obs.code?.text
        })),
        media: [
          {
            comment: 'Source ophthalmic image',
            link: {
              reference: `Media/${media.id}`,
              display: media.content.title || 'Ophthalmic Image'
            }
          }
        ],
        conclusion: analysisResult.overallAssessment.summary,
        conclusionCode: [
          {
            coding: [
              {
                system: 'http://local-ophtha-system.com/risk-levels',
                code: analysisResult.overallAssessment.risk,
                display: `${analysisResult.overallAssessment.risk.charAt(0).toUpperCase()}${analysisResult.overallAssessment.risk.slice(1)} Risk`
              }
            ]
          }
        ],
        extension: [
          {
            url: 'http://local-ophtha-system.com/ai-analysis-id',
            valueString: analysisResult.analysisId
          },
          {
            url: 'http://local-ophtha-system.com/ai-confidence',
            valueDecimal: Math.round(analysisResult.overallAssessment.confidence * 100) / 100
          },
          {
            url: 'http://local-ophtha-system.com/processing-time-ms',
            valueInteger: analysisResult.processingTimeMs
          },
          {
            url: 'http://local-ophtha-system.com/recommendations',
            valueString: analysisResult.recommendations.join('; ')
          }
        ]
      };

      await medplum.createResource(diagnosticReport);

      showNotification({
        color: 'green',
        title: 'AI Analysis Complete',
        message: `Created ${observations.length} biomarker observations and diagnostic report`,
        icon: <IconCheck />
      });

      // Note: Diagnostic reports will be refreshed on next page load or manual refresh

    } catch (error) {
      console.error('AI analysis failed:', error);
      showNotification({
        color: 'red',
        title: 'AI Analysis Failed',
        message: 'Failed to complete AI analysis. Please try again.',
        icon: <IconAlertTriangle />
      });
    } finally {
      setAnalyzing(null);
    }
  };

  const getAnalysisStatus = (media: Media): 'pending' | 'analyzed' | 'none' => {
    if (analyzing === media.id) return 'pending';
    
    const hasAnalysis = diagnosticReportsBundle?.entry?.some((entry: BundleEntry<DiagnosticReport>) => {
      const report = entry.resource as DiagnosticReport;
      return report.media?.some(m => m.link?.reference === `Media/${media.id}`);
    });
    
    return hasAnalysis ? 'analyzed' : 'none';
  };

  const getStatusBadge = (status: 'pending' | 'analyzed' | 'none'): JSX.Element => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" leftSection={<Loader size="xs" />}>Analyzing...</Badge>;
      case 'analyzed':
        return <Badge color="green" leftSection={<IconCheck size={12} />}>Analyzed</Badge>;
      case 'none':
        return <Badge color="gray" leftSection={<IconClock size={12} />}>Pending</Badge>;
    }
  };

  if (mediaLoading) {
    return <Loader />;
  }

  const mediaResources = mediaBundle?.entry?.map((entry: BundleEntry<Media>) => entry.resource as Media) || [];
  const ophthalmicImages = mediaResources.filter((media: Media) => 
    media.type?.text?.toLowerCase().includes('ophthalmic') && 
    media.content.contentType?.startsWith('image/')
  );

  return (
    <Stack gap="md">
      <Title order={3}>AI Image Analysis</Title>
      
      {ophthalmicImages.length === 0 ? (
        <Alert>
          No ophthalmic images found for this patient. Upload images first to enable AI analysis.
        </Alert>
      ) : (
        <Stack gap="sm">
          {ophthalmicImages.map((media: Media) => {
            const status = getAnalysisStatus(media);
            return (
              <Card key={media.id} shadow="sm" p="md" withBorder>
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={500}>{media.content.title || 'Ophthalmic Image'}</Text>
                    <Text size="sm" c="dimmed">
                      Uploaded: {media.createdDateTime ? new Date(media.createdDateTime).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </div>
                  <Group>
                    {getStatusBadge(status)}
                    <Button
                      leftSection={<IconBrain />}
                      onClick={() => handleAnalyzeImage(media)}
                      loading={analyzing === media.id}
                      disabled={analyzing !== null}
                      variant={status === 'analyzed' ? 'outline' : 'filled'}
                      size="sm"
                    >
                      {status === 'analyzed' ? 'Re-analyze' : 'Analyze'}
                    </Button>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}

      {diagnosticReportsBundle?.entry && diagnosticReportsBundle.entry.length > 0 && (
        <div>
          <Title order={4} mt="xl" mb="md">Recent AI Analysis Results</Title>
          <ResourceTable value={diagnosticReportsBundle} />
        </div>
      )}
    </Stack>
  );
} 