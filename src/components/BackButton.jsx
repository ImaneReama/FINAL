import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(-1)}
      className="fixed left-28 top-8 z-[100] flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900/40 text-white shadow-2xl backdrop-blur-2xl border border-white/5 transition-all hover:bg-[#F4D06F] hover:text-black group"
      aria-label="Retour"
    >
      <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
    </motion.button>
  );
}
