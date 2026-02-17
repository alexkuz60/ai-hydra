import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { HydraGears } from '@/components/home/HydraGears';
import hydraLogo from '@/assets/hydra-logo.png';

const Index = () => {
  return (
    <Layout>
      <div className="relative w-full h-[calc(100vh-2.5rem)] flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 select-none">
          <div className="flex items-center gap-3">
            <img src={hydraLogo} alt="Hydra logo" className="w-14 h-14 rounded-full" />
            <span
              className="text-foreground/80"
              style={{ fontFamily: '"Keania One", sans-serif', fontSize: 64, fontWeight: 400, lineHeight: 1 }}
            >
              ai*hYdra
            </span>
          </div>
          <span
            className="text-muted-foreground/60 pl-[4.25rem]"
            style={{ fontFamily: '"Quicksand", sans-serif', fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}
          >
            Здесь даже догмы эволюционируют
          </span>
        </div>
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
