"use client";

// This is a wrapper component that imports the new refactored SettingsManager
// We're using this approach to gradually migrate to the new implementation
import dynamic from 'next/dynamic';

// Dynamically import the new SettingsManager component
const NewSettingsManager = dynamic(
  () => import('./settings/SettingsManager'),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center">Loading settings...</div> }
);

// This wrapper component allows us to gradually migrate to the new implementation
// while maintaining compatibility with existing code
export default function SettingsManager() {
  return <NewSettingsManager />;
}