import React from 'react';
import { renderToString } from 'react-dom/server';
import { LabelsForm } from './src/app/(dashboard)/admin/website/about/_components/labels-form';

const formState = {
  settings: {
    labels: {}
  }
};

try {
  const html = renderToString(<LabelsForm form={formState} setForm={() => {}} />);
  console.log("Rendered successfully!");
} catch (e) {
  console.error("Render failed:", e);
}
