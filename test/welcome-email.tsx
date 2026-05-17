// welcome-email.tsx
import React from 'react';
import { Button, Section, Text } from '@react-email/components';

export default function WelcomeEmail({ name }) {
  return (
    <Section  style={{ backgroundColor: '#000', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, animation: 'fadeIn 1s' }}>
        Welcome, Swapnil bhai {name}
      </Text>
      <Button href="https://example.com" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
        Click Here
      </Button>
    </Section>
  );
}