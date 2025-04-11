"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the new SettingsManager component
const NewSettingsManager = dynamic(
  () => import('./settings/SettingsManager'),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center">Loading settings...</div> }
);

// This wrapper component allows us to gradually migrate to the new implementation
// while maintaining compatibility with existing code
export default function SettingsManagerWrapper() {
  return <NewSettingsManager />;
}
