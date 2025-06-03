import { DiagnosticReport, Observation } from '@medplum/fhirtypes';
import { useMedplum, useSearch } from '@medplum/react';
import { Card, Text, Title, Group, Badge, Grid, Progress, Stack, Alert, Divider } from '@mantine/core';
import { IconEye, IconBrain, IconAlertTriangle, IconCheck, IconClock } from '@tabler/icons-react';
import { JSX } from 'react';

interface AiResultsVisualizationProps {
  diagnosticReport: DiagnosticReport;
  patientId: string;
}

export function AiResultsVisualization({ diagnosticReport, patientId }: AiResultsVisualizationProps): JSX.Element {
  const medplum = useMedplum();

  // Get the observations referenced in this diagnostic report
  const observationIds = diagnosticReport.result?.map(ref => ref.reference?.replace('Observation/', '')).filter(Boolean) || [];
  
  // Search for the observations
  const [observationsBundle] = useSearch('Observation', {
    _id: observationIds.join(','),
    _include: '*'
  });

  const observations = observationsBundle?.entry?.map(entry => entry.resource as Observation) || [];

  // Extract analysis metadata from extensions
  const getExtensionValue = (url: string): string | number | undefined => {
    const extension = diagnosticReport.extension?.find(ext => ext.url === url);
    return extension?.valueString || extension?.valueInteger || extension?.valueDecimal;
  };

  const analysisId = getExtensionValue('http://local-ophtha-system.com/ai-analysis-id') as string;
  const confidence = getExtensionValue('http://local-ophtha-system.com/ai-confidence') as number;
  const processingTime = getExtensionValue('http://local-ophtha-system.com/processing-time-ms') as number;
  const recommendations = getExtensionValue('http://local-ophtha-system.com/recommendations') as string;

  // Determine risk level from conclusion codes
  const riskLevel = diagnosticReport.conclusionCode?.[0]?.coding?.[0]?.code as 'low' | 'moderate' | 'high' || 'unknown';
  
  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'green';
      case 'moderate': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getRiskIcon = (risk: string): JSX.Element => {
    switch (risk) {
      case 'low': return <IconCheck size={16} />;
      case 'moderate': return <IconClock size={16} />;
      case 'high': return <IconAlertTriangle size={16} />;
      default: return <IconEye size={16} />;
    }
  };

  const getBiomarkerStatus = (observation: Observation): 'normal' | 'abnormal' | 'borderline' => {
    const interpretation = observation.interpretation?.[0]?.coding?.[0]?.code;
    switch (interpretation) {
      case 'N': return 'normal';
      case 'A': return 'abnormal';
      case 'I': return 'borderline';
      default: return 'normal';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'normal': return 'green';
      case 'abnormal': return 'red';
      case 'borderline': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Stack gap="md">
      {/* Header with overall assessment */}
      <Card shadow="sm" p="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <div>
            <Group align="center" gap="sm">
              <IconBrain size={24} />
              <Title order={3}>AI Analysis Results</Title>
              <Badge 
                color={getRiskColor(riskLevel)} 
                leftSection={getRiskIcon(riskLevel)}
                size="lg"
              >
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" mt="xs">
              Analysis ID: {analysisId}
            </Text>
            <Text size="sm" c="dimmed">
              Performed: {diagnosticReport.effectiveDateTime ? new Date(diagnosticReport.effectiveDateTime).toLocaleString() : 'Unknown'}
            </Text>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <Text size="sm" fw={500}>
              AI Confidence: {confidence ? `${Math.round(confidence * 100)}%` : 'N/A'}
            </Text>
            <Progress 
              value={confidence ? confidence * 100 : 0} 
              color={confidence && confidence > 0.8 ? 'green' : confidence && confidence > 0.6 ? 'yellow' : 'red'}
              size="sm" 
              mt="xs"
            />
            <Text size="xs" c="dimmed" mt="xs">
              Processing time: {processingTime ? `${processingTime}ms` : 'N/A'}
            </Text>
          </div>
        </Group>

        {diagnosticReport.conclusion && (
          <Alert mt="md" color={getRiskColor(riskLevel)} title="Summary">
            {diagnosticReport.conclusion}
          </Alert>
        )}
      </Card>

      {/* Biomarker Results */}
      {observations.length > 0 && (
        <Card shadow="sm" p="md" withBorder>
          <Title order={4} mb="md">Biomarker Analysis</Title>
          <Grid>
            {observations.map((observation, index) => {
              const status = getBiomarkerStatus(observation);
              const value = observation.valueQuantity?.value;
              const unit = observation.valueQuantity?.unit;
              const biomarkerName = observation.code?.text || 'Unknown Biomarker';
              
              // Get confidence from notes
              const confidenceNote = observation.note?.find(note => 
                note.text?.includes('confidence')
              )?.text;
              const confidenceMatch = confidenceNote?.match(/(\d+)%/);
              const observationConfidence = confidenceMatch ? parseInt(confidenceMatch[1]) : null;

              return (
                <Grid.Col span={{ base: 12, md: 6 }} key={index}>
                  <Card shadow="xs" p="sm" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Text fw={500} size="sm">{biomarkerName}</Text>
                        <Group align="baseline" gap="xs">
                          <Text size="lg" fw={700}>
                            {value !== undefined ? value.toFixed(2) : 'N/A'}
                          </Text>
                          <Text size="sm" c="dimmed">{unit}</Text>
                        </Group>
                        {observationConfidence && (
                          <Text size="xs" c="dimmed">
                            Confidence: {observationConfidence}%
                          </Text>
                        )}
                      </div>
                      <Badge color={getStatusColor(status)} size="sm">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && (
        <Card shadow="sm" p="md" withBorder>
          <Title order={4} mb="md">Recommendations</Title>
          <Stack gap="xs">
            {recommendations.split(';').map((recommendation, index) => (
              <Text key={index} size="sm">
                • {recommendation.trim()}
              </Text>
            ))}
          </Stack>
        </Card>
      )}

      {/* Source Images */}
      {diagnosticReport.media && diagnosticReport.media.length > 0 && (
        <Card shadow="sm" p="md" withBorder>
          <Title order={4} mb="md">Source Images</Title>
          <Stack gap="xs">
            {diagnosticReport.media.map((media, index) => (
              <Group key={index} justify="space-between">
                <Text size="sm">{media.link?.display || 'Ophthalmic Image'}</Text>
                <Text size="xs" c="dimmed">{media.comment}</Text>
              </Group>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
} 