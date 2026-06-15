"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import PixoraLogo from "@/components/PixoraLogo";

export default function TransitionScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 bg-[#020204] z-50 flex flex-col justify-between items-center py-14 px-6 font-sans select-none overflow-hidden border-x border-white/5">
      
      {/* Top Text */}
      <div className="text-center mt-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight px-4 font-display">
          Tuning your feed,
          <span className="block mt-1 bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">just for you!</span>
        </h2>
      </div>

      {/* Center Carousel Animation */}
      <div className="relative w-full flex items-center justify-center h-[350px] overflow-hidden">
        {/* Left Card */}
        <motion.div 
          className="absolute left-[-40px] w-[140px] h-[260px] rounded-[1.5rem] overflow-hidden opacity-35 shadow-2xl border border-white/5"
          initial={{ x: -20, rotate: -3 }}
          animate={{ x: [0, -10, 0], rotate: [-3, -4, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=400&auto=format&fit=crop"
            alt="nature decor"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Center Main Card */}
        <motion.div 
          className="w-[220px] h-[310px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 z-10"
          initial={{ y: 10, scale: 0.98 }}
          animate={{ y: [0, -8, 0], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop"
            alt="cozy room"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Right Card */}
        <motion.div 
          className="absolute right-[-40px] w-[140px] h-[260px] rounded-[1.5rem] overflow-hidden opacity-35 shadow-2xl border border-white/5"
          initial={{ x: 20, rotate: 3 }}
          animate={{ x: [0, 10, 0], rotate: [3, 4, 3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop"
            alt="travel decor"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Bottom Logo */}
      <motion.div 
        className="mb-4"
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixoraLogo size="lg" />
      </motion.div>

    </div>
  );
}
