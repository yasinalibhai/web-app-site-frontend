import { Media, DiagnosticReport, Observation, BundleEntry } from '@medplum/fhirtypes';
import { useMedplum, ResourceTable, useSearch } from '@medplum/react';
import { Button, Card, Group, Text, Title, Badge, Stack, Loader, Alert, Image, Box } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconBrain, IconCheck, IconAlertTriangle, IconClock, IconPhoto } from '@tabler/icons-react';
import { JSX, useState, useEffect } from 'react';
import { MockAiService } from '../services/mockAiService';
import { AiResultsVisualization } from './AiResultsVisualization';

interface SelectedImageAnalysisProps {
  media: Media;
  patientId: string;
  onAnalysisComplete?: () => void;
}

export function SelectedImageAnalysis({ media, patientId, onAnalysisComplete }: SelectedImageAnalysisProps): JSX.Element {
  const medplum = useMedplum();
  const [analyzing, setAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');

  // Search for existing AI analysis reports for this specific image
  const [diagnosticReportsBundle, diagnosticReportsLoading] = useSearch('DiagnosticReport', {
    subject: `Patient/${patientId}`,
    code: 'ai-ophthalmic-analysis',
    _sort: '-_lastUpdated'
  });

  // Load the image when component mounts or media changes
  useEffect(() => {
    const loadImage = async (): Promise<void> => {
      if (!media.content.url) {
        setImageError('No image URL available');
        return;
      }

      try {
        // Check if the URL is a Binary reference or a direct storage URL
        if (media.content.url.startsWith('Binary/')) {
          // Handle Binary reference format: "Binary/{id}"
          const binaryId = media.content.url.replace('Binary/', '');
          
          // Try reading the binary resource directly
          try {
            const binary = await medplum.readResource('Binary', binaryId);
            
            if (binary.data) {
              // If we have base64 data, create a data URL
              const mimeType = media.content.contentType || 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${binary.data}`;
              setImageUrl(dataUrl);
              setImageError('');
              return;
            }
          } catch (binaryError) {
            // Continue to fallback method
          }
          
          // Fallback: Try direct URL construction for Binary reference
          const directUrl = `${medplum.getBaseUrl()}fhir/R4/Binary/${binaryId}`;
          setImageUrl(directUrl);
          setImageError('');
          
        } else {
          // Handle direct storage URL (like in our case)
          setImageUrl(media.content.url);
          setImageError('');
        }
        
      } catch (error) {
        setImageError('Failed to load image');
      }
    };

    loadImage();
  }, [media.content.url, media.content.contentType, medplum]);

  const handleAnalyzeImage = async (): Promise<void> => {
    if (!media.id || !media.content.url) {
      showNotification({
        color: 'red',
        title: 'Error',
        message: 'Invalid media resource'
      });
      return;
    }

    setAnalyzing(true);

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

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      showNotification({
        color: 'red',
        title: 'AI Analysis Failed',
        message: 'Failed to complete AI analysis. Please try again.',
        icon: <IconAlertTriangle />
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getAnalysisStatus = (): 'pending' | 'analyzed' | 'none' => {
    if (analyzing) return 'pending';
    
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

  // Find the most recent analysis for this image
  const currentAnalysis = diagnosticReportsBundle?.entry?.find((entry: BundleEntry<DiagnosticReport>) => {
    const report = entry.resource as DiagnosticReport;
    return report.media?.some(m => m.link?.reference === `Media/${media.id}`);
  })?.resource as DiagnosticReport;

  const status = getAnalysisStatus();
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>): void => {
    setImageError('Failed to load image');
  };

  return (
    <Stack gap="md">
      {/* Image Header */}
      <Card shadow="sm" p="md" withBorder>
        <Group justify="space-between" align="flex-start" mb="md">
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <IconPhoto size={20} />
              <Title order={3}>{media.content.title || 'Ophthalmic Image'}</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Uploaded: {formatDate(media.createdDateTime)}
            </Text>
            <Text size="sm" c="dimmed">
              Type: {media.content.contentType}
            </Text>
            {imageError && (
              <Text size="sm" c="red">
                {imageError}
              </Text>
            )}
          </div>
          <Group>
            {getStatusBadge(status)}
            <Button
              leftSection={<IconBrain />}
              onClick={handleAnalyzeImage}
              loading={analyzing}
              disabled={analyzing}
              variant={status === 'analyzed' ? 'outline' : 'filled'}
              size="sm"
            >
              {status === 'analyzed' ? 'Re-analyze' : 'Analyze Image'}
            </Button>
          </Group>
        </Group>

        {/* Image Preview */}
        <Box style={{ textAlign: 'center' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={media.content.title || 'Ophthalmic Image'}
              style={{ maxHeight: '300px', maxWidth: '100%' }}
              onError={handleImageError}
              fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE1MCA5NC40NzcyIDE0NS41MjMgOTAgMTQwIDkwQzEzNC40NzcgOTAgMTMwIDk0LjQ3NzIgMTMwIDEwMEMxMzAgMTA1LjUyMyAxMzQuNDc3IDExMCAxNDAgMTEwQzE0NS41MjMgMTEwIDE1MCAxMDUuNTIzIDE1MCAxMDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg=="
            />
          ) : (
            <Box style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'var(--mantine-color-gray-1)',
              borderRadius: '8px'
            }}>
              <Stack align="center">
                <IconPhoto size={48} color="var(--mantine-color-gray-5)" />
                <Text size="sm" c="dimmed">Loading image...</Text>
              </Stack>
            </Box>
          )}
        </Box>
      </Card>

      {/* Analysis Results */}
      {currentAnalysis ? (
        <AiResultsVisualization 
          diagnosticReport={currentAnalysis} 
          patientId={patientId} 
        />
      ) : status === 'none' ? (
        <Alert>
          Click "Analyze Image" to start AI analysis of this ophthalmic image.
        </Alert>
      ) : null}
    </Stack>
  );
} 