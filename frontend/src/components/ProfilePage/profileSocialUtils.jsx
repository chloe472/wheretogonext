import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
  Music,
  AtSign,
} from 'lucide-react';

export const platformIcon = (platform, size = 16) => {
  const p = String(platform || '').toLowerCase();
  if (p.includes('facebook')) return <Facebook size={size} aria-hidden />;
  if (p.includes('instagram')) return <Instagram size={size} aria-hidden />;
  if (p.includes('tiktok')) return <Music size={size} aria-hidden />;
  if (p.includes('twitter') || p === 'x' || p.includes('x ')) return <Twitter size={size} aria-hidden />;
  if (p.includes('youtube')) return <Youtube size={size} aria-hidden />;
  if (p.includes('linkedin')) return <Linkedin size={size} aria-hidden />;
  if (p.includes('threads')) return <AtSign size={size} aria-hidden />;
  return <Globe size={size} aria-hidden />;
};
