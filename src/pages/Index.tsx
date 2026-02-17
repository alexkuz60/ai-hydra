import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { HydraGears } from '@/components/home/HydraGears';

const Index = () => {
  return (
    <Layout>
      <div className="relative w-full h-[calc(100vh-2.5rem)] flex items-center justify-center overflow-hidden">
        <HydraGears className="max-w-[min(90vw,90vh)] max-h-[min(90vw,90vh)]" />
      </div>
    </Layout>
  );
};

export default Index;
