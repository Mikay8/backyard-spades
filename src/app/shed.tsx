// The Shed moved: its items now sit under the partner card on Pick Your
// Partner. Old links to /shed land there.
import { Redirect } from 'expo-router';
import React from 'react';

export default function Shed() {
  return <Redirect href="/pick" />;
}
