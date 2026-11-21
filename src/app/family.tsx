// The Family screen was retired: the family strip on Home shows everyone,
// tapping a face opens their partner page (details, buy, favourite), and
// Pick Your Partner handles picking. Old links to /family land on Home.
import { Redirect } from 'expo-router';
import React from 'react';

export default function Family() {
  return <Redirect href="/" />;
}
