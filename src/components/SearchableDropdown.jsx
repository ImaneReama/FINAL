import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function SearchableDropdown({ options, value, onChange, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="mb-1 block text-sm font-medium text-muted">{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-app bg-white/5 px-4 py-4 outline-none transition hover:border-[#F4D06F] backdrop-blur-md"
      >
        <span className={value ? 'text-app font-bold' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-5 w-5 text-[#F4D06F] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl border border-app bg-app shadow-2xl backdrop-blur-3xl"
          >
            <div className="sticky top-0 border-b border-app bg-app/80 p-3 backdrop-blur-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none border border-app focus:border-[#F4D06F] text-app"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`cursor-pointer px-4 py-4 text-sm font-bold transition hover:bg-[#F4D06F] hover:text-black ${
                      value === option ? 'bg-[#F4D06F]/20 text-[#F4D06F]' : 'text-app'
                    }`}
                  >
                    {option}
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-muted">Aucun résultat trouvé</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
