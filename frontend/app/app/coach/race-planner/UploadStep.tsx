'use client';

import React, { useRef } from 'react';
import { Upload } from '@/components/ui/icons';
import { Button, Card } from '@/components/ui';

interface UploadStepProps {
  onFileSelected: (_gpxData: string, _fileName: string) => void;
}

export default function UploadStep({ onFileSelected }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onFileSelected(event.target?.result as string, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="max-w-2xl mx-auto p-12 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".gpx"
        className="hidden"
      />
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-6 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
          <Upload className="w-12 h-12 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Importez votre fichier GPX</h2>
          <p className="text-muted-foreground mt-2">
            Glissez-déposez ou cliquez pour sélectionner le parcours de votre course.
          </p>
        </div>
        <Button size="lg" className="rounded-full px-8">
          Sélectionner un fichier
        </Button>
        <p className="text-xs text-muted-foreground">
          Supporte les fichiers GPX standards de Garmin, Strava, Komoot...
        </p>
      </div>
    </Card>
  );
}
