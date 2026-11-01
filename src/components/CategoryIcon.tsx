import {
  Briefcase,
  Clapperboard,
  Compass,
  Package,
  PawPrint,
  Star,
  Trophy,
  Utensils,
} from 'lucide-react';
import { CategoryIconKey } from '../types/game';

interface CategoryIconProps {
  iconKey: CategoryIconKey;
  className?: string;
}

export function CategoryIcon({ iconKey, className = 'w-6 h-6' }: CategoryIconProps) {
  switch (iconKey) {
    case 'star':
      return <Star className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'paw':
      return <PawPrint className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'clapperboard':
      return <Clapperboard className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    default:
      return <Star className={className} />;
  }
}
