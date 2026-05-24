import React from 'react';
import { Section, Text, Button } from '@react-email/components';

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Section style={{ backgroundColor: '#000', borderRadius: 8, animation: 'fadeIn 1s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', opacity: 0.9, position: 'relative', zIndex: 1 }}>
      <Text style={{ fontSize: 24, transform: 'scale(1)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
        Welcome, {name}
      </Text>
      <Button href="https://example.com" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundImage: 'url(btn.png)' }}>
        Get Started
      </Button>
    </Section>
  );
}