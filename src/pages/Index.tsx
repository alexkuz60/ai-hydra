import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { HydraGears } from '@/components/home/HydraGears';

const Index = () => {
  return (
    <Layout>
      <div className="relative w-full h-[calc(100vh-2.5rem)] flex items-center justify-center overflow-hidden">
        <span
          className="absolute top-4 left-4 z-10 select-none text-foreground/80"
          style={{ fontFamily: '"Keania One", sans-serif', fontSize: 64, fontWeight: 400, lineHeight: 1 }}
        >
          ai*hYdra
        </span>
        <HydraGears
          className="max-w-[min(90vw,90vh)] max-h-[min(90vw,90vh)]"
          activeConnections={[{ from: 0, to: 1 }, { from: 4, to: 1 }]}
          spinning={[0, 1, 4]}
        />
      </div>
    </Layout>
  );
};

export default Index;
