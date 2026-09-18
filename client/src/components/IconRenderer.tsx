import React from 'react';
import {
  Hand,
  UserCheck,
  Shield,
  Smile,
  Footprints,
  Eye,
  Glasses,
  HardHat,
  Sparkles,
  HelpCircle,
  LucideProps
} from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, ...props }) => {
  const normalized = (name || '').toLowerCase().replace(/[-_]/g, '');

  switch (normalized) {
    case 'hand':
    case 'gloves':
      return <Hand {...props} />;
    case 'usercheck':
    case 'haircover':
    case 'hairnet':
    case 'hat':
      return <UserCheck {...props} />;
    case 'shield':
    case 'apron':
    case 'coat':
      return <Shield {...props} />;
    case 'smile':
    case 'facemask':
    case 'mask':
      return <Smile {...props} />;
    case 'footprints':
    case 'safetyshoes':
    case 'shoes':
    case 'boots':
      return <Footprints {...props} />;
    case 'eye':
    case 'goggles':
      return <Eye {...props} />;
    case 'glasses':
      return <Glasses {...props} />;
    case 'hardhat':
    case 'helmet':
      return <HardHat {...props} />;
    default:
      return <Shield {...props} />;
  }
};
