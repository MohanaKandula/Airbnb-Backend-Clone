import React from 'react';
import { Globe, IndianRupee } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h5 className="font-bold text-gray-900 text-sm mb-4">Support</h5>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><a href="#" className="hover:underline">Help Center</a></li>
            <li><a href="#" className="hover:underline">AirCover</a></li>
            <li><a href="#" className="hover:underline">Anti-discrimination</a></li>
            <li><a href="#" className="hover:underline">Disability support</a></li>
            <li><a href="#" className="hover:underline">Cancellation options</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-gray-900 text-sm mb-4">Hosting</h5>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><a href="#" className="hover:underline">Airbnb your home</a></li>
            <li><a href="#" className="hover:underline">AirCover for Hosts</a></li>
            <li><a href="#" className="hover:underline">Hosting resources</a></li>
            <li><a href="#" className="hover:underline">Community forum</a></li>
            <li><a href="#" className="hover:underline">Hosting responsibly</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-gray-900 text-sm mb-4">Airbnb</h5>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><a href="#" className="hover:underline">Newsroom</a></li>
            <li><a href="#" className="hover:underline">New features</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
            <li><a href="#" className="hover:underline">Investors</a></li>
            <li><a href="#" className="hover:underline">Gift cards</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-gray-900 text-sm mb-4">Destination Clone</h5>
          <p className="text-sm text-gray-600 leading-relaxed">
            Built as a professional React + Spring Boot enterprise integration. Experience premium design tokens, fluid layouts, and complete booking flows.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 text-gray-600 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
            <span>© 2026 Airbnb, Inc.</span>
            <span className="text-gray-300 hidden md:inline">·</span>
            <a href="#" className="hover:underline">Privacy</a>
            <span className="text-gray-300 hidden md:inline">·</span>
            <a href="#" className="hover:underline">Terms</a>
            <span className="text-gray-300 hidden md:inline">·</span>
            <a href="#" className="hover:underline">Sitemap</a>
          </div>

          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1.5 cursor-pointer hover:underline">
              <Globe className="w-4 h-4" />
              <span>English (US)</span>
            </span>
            <span className="flex items-center space-x-0.5 cursor-pointer hover:underline font-semibold text-gray-900">
              <IndianRupee className="w-4 h-4" />
              <span>INR</span>
            </span>
            <div className="flex items-center space-x-4">
              {/* Facebook Inline SVG */}
              <svg className="w-4 h-4 fill-current cursor-pointer hover:text-gray-900" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
              {/* Twitter/X Inline SVG */}
              <svg className="w-4 h-4 fill-current cursor-pointer hover:text-gray-900" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              {/* Instagram Inline SVG */}
              <svg className="w-4 h-4 fill-current cursor-pointer hover:text-gray-900" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
