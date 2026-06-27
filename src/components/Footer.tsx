import React, { useState } from 'react';
import { Send, Instagram, Twitter, Linkedin, Sparkles, Palette, Globe, Figma, Pin, Link2 } from 'lucide-react';
import { FooterConfig, NavLink } from '../types';

interface FooterProps {
  config: FooterConfig;
  links: NavLink[];
  onNavigate: (page: 'home' | 'portfolio' | 'studio' | 'blog' | 'contact') => void;
}

const renderSocialIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'instagram':
      return <Instagram size={14} />;
    case 'twitter':
    case 'x':
      return <Twitter size={14} />;
    case 'linkedin':
      return <Linkedin size={14} />;
    case 'palette':
    case 'artstation':
      return <Palette size={14} />;
    case 'globe':
    case 'behance':
      return <Globe size={14} />;
    case 'figma':
    case 'dribbble':
      return <Figma size={14} />;
    case 'pin':
    case 'pinterest':
      return <Pin size={14} />;
    default:
      return <Link2 size={14} />;
  }
};

export default function Footer({ config, links, onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      console.log('Newsletter subscription request:', email);
      if ((window as any).trackAnalyticsEvent) {
        (window as any).trackAnalyticsEvent({ type: 'lead', leadType: 'newsletter_signup' });
      }
      setSubscribed(true);
      setEmail('');
    }
  };

  const handleLinkClick = (page: 'home' | 'portfolio' | 'studio' | 'blog' | 'contact') => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleSocials = config.socials?.filter(s => s.visible) ?? [];

  return (
    <footer id="footer-section" className="bg-black border-t border-neutral-900 py-16 px-6 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 rounded-full bg-neutral-900/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        
        {/* Column 1: Studio Info */}
        <div className="md:col-span-2 space-y-6">
          <button
            onClick={() => handleLinkClick('home')}
            className="flex flex-col items-start cursor-pointer text-left group"
          >
            <span className="font-mono text-xl font-black tracking-widest text-white leading-none">
              KAIJU
            </span>
            <span className="font-sans text-[8px] tracking-[0.3em] font-medium text-neutral-400 mt-1 uppercase">
              STUDIOS
            </span>
          </button>
          <p className="font-sans text-xs text-neutral-400 max-w-sm leading-relaxed">
            {config.aboutText}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {visibleSocials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                title={social.name}
                className="w-8 h-8 rounded-none border border-neutral-900 bg-[#070707] hover:bg-orange-500 hover:text-white hover:border-orange-500 text-neutral-500 flex items-center justify-center transition-all duration-300"
              >
                {renderSocialIcon(social.icon)}
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Quick Links Navigation */}
        <div className="space-y-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-white font-bold">
            DIRECTORY INDEX
          </h4>
          <div className="flex flex-col space-y-2.5">
            {links.map((link) => (
              <button
                key={link.page}
                onClick={() => handleLinkClick(link.page as any)}
                className="text-left font-sans text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Newsletter & Contact details */}
        <div className="space-y-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-white font-bold">
            BROADCAST INTEL
          </h4>
          <p className="font-sans text-xs text-neutral-400 leading-relaxed">
            Subscribe to receive priority notifications on seasonal commission waitlists and sequential technical essays.
          </p>

          {subscribed ? (
            <div className="p-3 bg-neutral-950 border border-neutral-900 text-[10px] font-mono uppercase tracking-wider text-neutral-300">
              ✓ INTEL BROADCAST ACTIVE
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex border border-neutral-800 focus-within:border-white transition-colors">
              <input
                type="email"
                required
                placeholder="Secure email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent font-sans text-xs px-3 py-2 text-white w-full focus:outline-none"
              />
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-white text-neutral-400 hover:text-black px-4 flex items-center justify-center transition-colors cursor-pointer border-l border-neutral-800"
              >
                <Send size={12} />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Column 4: Bottom copyright panel */}
      <div className="max-w-7xl mx-auto border-t border-neutral-900/60 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
        <span>{config.copyright}</span>
        <div className="flex space-x-4 items-center">
          <span>PIPELINE VER: 2.1.0-KJU</span>
          <span>//</span>
          <span className="flex items-center gap-1">
            CRAFTED WITH INTENSITY <Sparkles size={10} />
          </span>
          <span>//</span>
          <a
            href="/goat02"
            className="text-neutral-600 hover:text-neutral-300 hover:underline transition-colors lowercase cursor-pointer"
          >
            Masters
          </a>
        </div>
      </div>
    </footer>
  );
}
