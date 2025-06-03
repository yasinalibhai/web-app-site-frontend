import { JSX } from 'react';
import { usePatient } from '../../hooks/usePatient';
import { AiAnalysisWithSidebar } from '../../components/AiAnalysisWithSidebar';
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
      <AiAnalysisWithSidebar patientId={patient.id} patient={patient} />
    </Document>
  );
} 