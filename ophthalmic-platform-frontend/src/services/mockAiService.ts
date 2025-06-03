// Mock AI Service for Ophthalmic Image Analysis
// This simulates what a real AI service would return

export interface BiomarkerResult {
  name: string;
  value: number;
  unit: string;
  referenceRange?: {
    low: number;
    high: number;
  };
  confidence: number; // 0-1
  category: 'normal' | 'abnormal' | 'borderline';
}

export interface SegmentationResult {
  segmentType: string;
  area: number; // in pixels or mm²
  confidence: number;
  coordinates?: number[][]; // boundary coordinates
}

export interface AiAnalysisResult {
  analysisId: string;
  timestamp: string;
  imageId: string;
  patientId: string;
  modelVersion: string;
  processingTimeMs: number;
  biomarkers: BiomarkerResult[];
  segmentations: SegmentationResult[];
  overallAssessment: {
    risk: 'low' | 'moderate' | 'high';
    confidence: number;
    summary: string;
  };
  recommendations: string[];
}

// Mock biomarker data for different ophthalmic conditions
const MOCK_BIOMARKERS: BiomarkerResult[] = [
  {
    name: 'Retinal Nerve Fiber Layer Thickness',
    value: 85.2,
    unit: 'μm',
    referenceRange: { low: 80, high: 110 },
    confidence: 0.92,
    category: 'normal'
  },
  {
    name: 'Cup-to-Disc Ratio',
    value: 0.3,
    unit: 'ratio',
    referenceRange: { low: 0.1, high: 0.4 },
    confidence: 0.89,
    category: 'normal'
  },
  {
    name: 'Macular Thickness',
    value: 245.8,
    unit: 'μm',
    referenceRange: { low: 220, high: 300 },
    confidence: 0.95,
    category: 'normal'
  },
  {
    name: 'Drusen Area',
    value: 0.12,
    unit: 'mm²',
    referenceRange: { low: 0, high: 0.1 },
    confidence: 0.87,
    category: 'borderline'
  },
  {
    name: 'Vessel Density',
    value: 18.5,
    unit: '%',
    referenceRange: { low: 15, high: 25 },
    confidence: 0.91,
    category: 'normal'
  }
];

const MOCK_SEGMENTATIONS: SegmentationResult[] = [
  {
    segmentType: 'Optic Disc',
    area: 2.4,
    confidence: 0.94
  },
  {
    segmentType: 'Optic Cup',
    area: 0.72,
    confidence: 0.88
  },
  {
    segmentType: 'Macula',
    area: 5.2,
    confidence: 0.96
  },
  {
    segmentType: 'Blood Vessels',
    area: 15.8,
    confidence: 0.82
  }
];

// Simulate network delay and processing time
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export class MockAiService {
  static async analyzeImage(imageId: string, patientId: string): Promise<AiAnalysisResult> {
    // Simulate processing delay (2-5 seconds)
    const processingTime = Math.random() * 3000 + 2000;
    await delay(processingTime);

    // Add some randomization to make results more realistic
    const randomizedBiomarkers = MOCK_BIOMARKERS.map(biomarker => ({
      ...biomarker,
      value: biomarker.value * (0.9 + Math.random() * 0.2), // ±10% variation
      confidence: Math.max(0.7, biomarker.confidence * (0.9 + Math.random() * 0.2))
    }));

    const randomizedSegmentations = MOCK_SEGMENTATIONS.map(seg => ({
      ...seg,
      area: seg.area * (0.9 + Math.random() * 0.2),
      confidence: Math.max(0.7, seg.confidence * (0.9 + Math.random() * 0.2))
    }));

    // Determine overall risk based on biomarkers
    const abnormalCount = randomizedBiomarkers.filter(b => b.category === 'abnormal').length;
    const borderlineCount = randomizedBiomarkers.filter(b => b.category === 'borderline').length;
    
    let risk: 'low' | 'moderate' | 'high' = 'low';
    let summary = 'Normal ophthalmic findings with no significant abnormalities detected.';
    let recommendations: string[] = ['Continue routine ophthalmic monitoring'];

    if (abnormalCount > 0 || borderlineCount > 2) {
      risk = 'high';
      summary = 'Multiple abnormal findings detected requiring immediate attention.';
      recommendations = [
        'Immediate ophthalmology consultation recommended',
        'Consider additional imaging studies',
        'Monitor closely for disease progression'
      ];
    } else if (borderlineCount > 0) {
      risk = 'moderate';
      summary = 'Some borderline findings detected that may require follow-up.';
      recommendations = [
        'Follow-up imaging in 3-6 months',
        'Monitor for changes in visual symptoms',
        'Consider specialist consultation if symptoms worsen'
      ];
    }

    return {
      analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      imageId,
      patientId,
      modelVersion: 'OphthalmoAI-v2.1.3',
      processingTimeMs: Math.round(processingTime),
      biomarkers: randomizedBiomarkers,
      segmentations: randomizedSegmentations,
      overallAssessment: {
        risk,
        confidence: 0.85 + Math.random() * 0.1,
        summary
      },
      recommendations
    };
  }

  // Mock function to simulate segmentation mask generation
  static async generateSegmentationMask(imageId: string): Promise<Blob> {
    await delay(1000); // Simulate processing time
    
    // Create a simple mock segmentation mask (this would normally be generated by the AI model)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw a simple mock segmentation (colored regions)
      ctx.fillStyle = '#FF000080'; // Semi-transparent red for optic disc
      ctx.beginPath();
      ctx.arc(256, 256, 50, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#00FF0080'; // Semi-transparent green for macula
      ctx.beginPath();
      ctx.arc(300, 200, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#0000FF80'; // Semi-transparent blue for blood vessels
      ctx.strokeStyle = '#0000FF80';
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
        ctx.stroke();
      }
    }
    
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob || new Blob()), 'image/png');
    });
  }
} 