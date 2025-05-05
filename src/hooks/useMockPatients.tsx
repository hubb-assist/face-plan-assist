
import { useState, useEffect, useCallback } from 'react';

interface Patient {
  id: string;
  name: string;
  birthDate: Date;
  gender: 'M' | 'F' | 'O';
  cpf: string;
  imageUrl: string | null;
  createdAt: Date;
  clinic_id: string;
  user_id: string;
}

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Maria Silva',
    birthDate: new Date('1985-05-15'),
    gender: 'F',
    cpf: '123.456.789-00',
    imageUrl: '/placeholder.svg',
    createdAt: new Date('2023-01-10'),
    clinic_id: 'mock-clinic-id',
    user_id: 'mock-user-id'
  },
  {
    id: '2',
    name: 'João Santos',
    birthDate: new Date('1990-12-03'),
    gender: 'M',
    cpf: '987.654.321-00',
    imageUrl: null,
    createdAt: new Date('2023-02-05'),
    clinic_id: 'mock-clinic-id',
    user_id: 'mock-user-id'
  },
  {
    id: '3',
    name: 'Ana Carolina Oliveira',
    birthDate: new Date('1978-08-22'),
    gender: 'F',
    cpf: '456.789.123-00',
    imageUrl: '/placeholder.svg',
    createdAt: new Date('2023-03-15'),
    clinic_id: 'mock-clinic-id',
    user_id: 'mock-user-id'
  }
];

export const useMockPatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      setPatients(mockPatients);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getPatientById = useCallback((id: string) => {
    return mockPatients.find(patient => patient.id === id) || null;
  }, []);

  const addPatient = useCallback((patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient: Patient = {
      ...patient,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  }, []);

  return {
    patients,
    loading,
    getPatientById,
    addPatient
  };
};
