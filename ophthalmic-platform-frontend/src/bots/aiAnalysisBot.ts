import { BotEvent, MedplumClient } from '@medplum/core';
import { Media, Observation, DiagnosticReport, Binary, Annotation, Reference, Patient } from '@medplum/fhirtypes';
import { MockAiService, AiAnalysisResult } from '../services/mockAiService';

/**
 * AI Analysis Bot
 * 
 * This bot triggers when a new Media resource is created (ophthalmic image upload)
 * and automatically processes it with AI analysis, creating Observation and 
 * DiagnosticReport resources with the results.
 * 
 * Triggered by: Subscription on Media resource creation
 */

export async function aiAnalysisBot(medplum: MedplumClient, event: BotEvent<Media>): Promise<void> {
  console.log('AI Analysis Bot triggered for Media:', event.input.id);

  const media = event.input;

  // Validate that this is an ophthalmic image
  if (!isOphthalmicImage(media)) {
    console.log('Skipping non-ophthalmic image');
    return;
  }

  // Extract patient reference
  if (!media.subject?.reference) {
    console.error('Media resource has no patient reference');
    return;
  }

  const patientId = media.subject.reference.replace('Patient/', '');
  const imageId = media.content.url?.replace('Binary/', '') || '';

  try {
    // Call mock AI service to analyze the image
    console.log(`Starting AI analysis for image ${imageId}, patient ${patientId}`);
    const analysisResult = await MockAiService.analyzeImage(imageId, patientId);
    
    console.log(`AI analysis completed in ${analysisResult.processingTimeMs}ms`);

    // Create Observation resources for each biomarker
    const observations = await createBiomarkerObservations(medplum, analysisResult, media);
    
    // Create DiagnosticReport summarizing the findings
    const diagnosticReport = await createDiagnosticReport(medplum, analysisResult, media, observations);

    // Optionally create segmentation mask as a Binary resource
    await createSegmentationMask(medplum, analysisResult, media);

    console.log(`AI analysis complete. Created ${observations.length} observations and diagnostic report ${diagnosticReport.id}`);

  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Create a DiagnosticReport indicating the failure
    await createFailedAnalysisReport(medplum, media, error);
  }
}

function isOphthalmicImage(media: Media): boolean {
  // Check if this is an ophthalmic image based on the type or note
  const isOphthalmicType = media.type?.text?.toLowerCase().includes('ophthalmic') ||
                          media.note?.some((note: Annotation) => note.text?.toLowerCase().includes('ophthalmic'));
  
  // Also check if it's an image type
  const isImage = media.content.contentType?.startsWith('image/');
  
  return Boolean(isOphthalmicType && isImage);
}

async function createBiomarkerObservations(
  medplum: MedplumClient, 
  analysisResult: AiAnalysisResult, 
  media: Media
): Promise<Observation[]> {
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
      subject: media.subject as Reference<Patient>,
      effectiveDateTime: analysisResult.timestamp,
      valueQuantity: {
        value: Math.round(biomarker.value * 100) / 100, // Round to 2 decimal places
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
      component: biomarker.referenceRange ? [
        {
          code: {
            text: 'Reference Range'
          },
          valueRange: {
            low: {
              value: biomarker.referenceRange.low,
              unit: biomarker.unit
            },
            high: {
              value: biomarker.referenceRange.high,
              unit: biomarker.unit
            }
          }
        }
      ] : undefined,
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

  return observations;
}

async function createDiagnosticReport(
  medplum: MedplumClient,
  analysisResult: AiAnalysisResult,
  media: Media,
  observations: Observation[]
): Promise<DiagnosticReport> {
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
    subject: media.subject as Reference<Patient>,
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

  return await medplum.createResource(diagnosticReport);
}

async function createSegmentationMask(
  medplum: MedplumClient,
  analysisResult: AiAnalysisResult,
  media: Media
): Promise<Binary | null> {
  try {
    // Generate mock segmentation mask
    const maskBlob = await MockAiService.generateSegmentationMask(analysisResult.imageId);
    
    // Create Binary resource for the segmentation mask
    const maskBinary = await medplum.createBinary(
      maskBlob,
      `segmentation_mask_${analysisResult.analysisId}.png`,
      'image/png'
    );

    // Create Media resource linking the segmentation mask to the patient
    await medplum.createResource({
      resourceType: 'Media',
      status: 'completed',
      type: {
        coding: [
          {
            system: 'http://local-ophtha-system.com/media-types',
            code: 'segmentation-mask',
            display: 'AI Segmentation Mask'
          }
        ],
        text: 'AI Segmentation Mask'
      },
      subject: media.subject,
      createdDateTime: analysisResult.timestamp,
      content: {
        contentType: 'image/png',
        url: `Binary/${maskBinary.id}`,
        title: `AI Segmentation Mask - ${analysisResult.analysisId}`
      },
      note: [
        {
          text: `Generated by ${analysisResult.modelVersion} for analysis ${analysisResult.analysisId}`
        }
      ],
      derivedFrom: [
        {
          reference: `Media/${media.id}`,
          display: 'Source ophthalmic image'
        }
      ]
    });

    console.log(`Created segmentation mask binary: ${maskBinary.id}`);
    return maskBinary;

  } catch (error) {
    console.error('Failed to create segmentation mask:', error);
    return null;
  }
}

async function createFailedAnalysisReport(
  medplum: MedplumClient,
  media: Media,
  error: unknown
): Promise<DiagnosticReport> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  const diagnosticReport: DiagnosticReport = {
    resourceType: 'DiagnosticReport',
    status: 'partial', // Indicates incomplete/failed analysis
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
      text: 'AI Ophthalmic Image Analysis (Failed)',
      coding: [
        {
          system: 'http://local-ophtha-system.com/procedures',
          code: 'ai-ophthalmic-analysis-failed',
          display: 'Failed AI Ophthalmic Image Analysis'
        }
      ]
    },
    subject: media.subject as Reference<Patient>,
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    performer: [
      {
        display: 'AI Analysis System'
      }
    ],
    media: [
      {
        comment: 'Source ophthalmic image (analysis failed)',
        link: {
          reference: `Media/${media.id}`,
          display: media.content.title || 'Ophthalmic Image'
        }
      }
    ],
    conclusion: `AI analysis failed: ${errorMessage}. Manual review may be required.`,
    conclusionCode: [
      {
        coding: [
          {
            system: 'http://local-ophtha-system.com/analysis-status',
            code: 'failed',
            display: 'Analysis Failed'
          }
        ]
      }
    ]
  };

  return await medplum.createResource(diagnosticReport);
} 