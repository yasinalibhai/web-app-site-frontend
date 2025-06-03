import { JSX } from 'react';
import { usePatient } from '../../hooks/usePatient';
import { AiAnalysisControl } from '../../components/AiAnalysisControl';
import { Document } from '@medplum/react';
import { Loader } from '@mantine/core';

export function AiAnalysisTab(): JSX.Element {
  const patient = usePatient();

  if (!patient?.id) {
    return (
      <Document>
        <Loader />
      </Document>
    );
  }

  return (
    <Document>
      <AiAnalysisControl patientId={patient.id} />
    </Document>
  );
} 