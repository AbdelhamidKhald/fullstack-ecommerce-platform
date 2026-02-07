import { Link } from 'react-router-dom';
import { Package, Mail, ArrowRight, Github, Linkedin } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export function Footer() {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      showToast('Thanks for subscribing!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-surface-900 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">{APP_NAME}</span>
            </Link>
            <p className="text-surface-400 text-sm leading-relaxed mb-6">
              A modern full-stack e-commerce platform built with React, TypeScript, Supabase & Tailwind CSS.
            </p>
            <div className="space-y-3">
              <a href="https://github.com/AbdelhamidKhald" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-surface-400 hover:text-white transition-colors">
                <Github className="w-4 h-4 flex-shrink-0" />
                <span>github.com/AbdelhamidKhald</span>
              </a>
              <a href="mailto:abdelhamidkhaldacc@gmail.com" className="flex items-center gap-3 text-sm text-surface-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>abdelhamidkhaldacc@gmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/abdelhamid-khald-4782462a4/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-surface-400 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4 flex-shrink-0" />
                <span>LinkedIn Profile</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { to: '/shop', label: 'All Products' },
                { to: '/shop?category=electronics', label: 'Electronics' },
                { to: '/shop?category=fashion', label: 'Fashion' },
                { to: '/shop?category=home-garden', label: 'Home & Garden' },
                { to: '/shop?category=sports-outdoors', label: 'Sports' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-surface-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Project</h4>
            <ul className="space-y-3">
              {[
                { href: 'https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform', label: 'Source Code' },
                { href: 'https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform/blob/main/README.md', label: 'Documentation' },
                { href: 'https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform/blob/main/CONTRIBUTING.md', label: 'Contributing' },
                { href: 'https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform/blob/main/LICENSE', label: 'MIT License' },
                { href: 'https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform/issues', label: 'Report Issue' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-surface-400 hover:text-white transition-colors inline-flex items-center gap-1 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Stay Updated</h4>
            <p className="text-sm text-surface-400 mb-4">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full btn-primary text-sm py-2.5"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-surface-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-surface-500">
              &copy; {new Date().getFullYear()} {APP_NAME}. Built by{' '}
              <a href="https://github.com/AbdelhamidKhald" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors">
                Abdelhamid Khaled
              </a>
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform" target="_blank" rel="noopener noreferrer" className="text-sm text-surface-500 hover:text-white transition-colors">GitHub</a>
              <a href="https://github.com/AbdelhamidKhald/fullstack-ecommerce-platform/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-sm text-surface-500 hover:text-white transition-colors">License</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
