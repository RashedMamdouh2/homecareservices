import React, { useEffect, useRef } from 'react';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { BASE_URL, getAuthHeaders } from '@/lib/api';

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.init();

cornerstoneWADOImageLoader.webWorkerManager.initialize({
  maxWebWorkers: navigator.hardwareConcurrency || 4,
  startWebWorkersOnDemand: true,
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dicomId?: string;
}

export function DicomViewer({ open, onOpenChange, dicomId }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !dicomId || !elementRef.current) return;

    const element = elementRef.current;
    cornerstone.enable(element);

    const load = async () => {
      // 1️⃣ download dicom
      const res = await fetch(`${BASE_URL}/Dicom/download/${dicomId}`, {
        headers: getAuthHeaders(),
      });
      const blob = await res.blob();
      const file = new File([blob], 'image.dcm');

      // 2️⃣ register file
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);

      // 3️⃣ load first frame to read metadata
      const image = await cornerstone.loadImage(imageId);
      const frames = Number(image.data.string('x00280008')) || 1;

      // 4️⃣ build stack (frames)
      const imageIds: string[] = [];
      for (let i = 0; i < frames; i++) {
        imageIds.push(`${imageId}?frame=${i}`);
      }

      // 5️⃣ display first slice
      cornerstone.displayImage(
        element,
        await cornerstone.loadImage(imageIds[0])
      );

      // 6️⃣ stack scrolling
      const stack = {
        currentImageIdIndex: 0,
        imageIds,
      };

      cornerstoneTools.addStackStateManager(element, ['stack']);
      cornerstoneTools.addToolState(element, 'stack', stack);

      // tools
      cornerstoneTools.setToolActive('StackScrollMouseWheel', {});
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 4 });
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 });
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
    };

    load();

    return () => {
      cornerstone.disable(element);
    };
  }, [open, dicomId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            DICOM Viewer (Multi-Slice)
          </DialogTitle>
        </DialogHeader>

        <Card className="w-full h-full p-2">
          <div
            ref={elementRef}
            className="w-full h-full bg-black rounded"
          />
        </Card>

        <div className="text-xs text-muted-foreground mt-2">
          Mouse:
          <ul className="list-disc list-inside">
            <li>Scroll: change slice</li>
            <li>Left click: Window / Level</li>
            <li>Middle click: Zoom</li>
            <li>Right click: Pan</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
