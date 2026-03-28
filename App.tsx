import React from 'react';
import { PasswordForm } from './components/PasswordForm';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:p-6 font-sans text-slate-800 bg-gray-50">
      
      {/* 极简背景装饰 - 仅保留微妙的渐变 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-50 -z-10"></div>

      <header className="w-full max-w-lg mb-10 text-center space-y-5 animate-fade-in-up">
        {/* Removed Icon Section */}
        
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            确定性密码生成器
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium">
            基于 HMAC-SHA256 的无状态保险箱
          </p>
        </div>
        
        <div className="flex justify-center gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200/60">
            <Lock size={12} className="text-slate-400" />
            <span>离线计算</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200/60">
            <CheckCircle2 size={12} className="text-slate-400" />
            <span>无云端存储</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[480px] animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <PasswordForm />
      </main>

      <footer className="mt-12 text-center space-y-2 opacity-60 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <p className="text-xs text-slate-400 font-medium">
          Deterministic Vault v4.5
        </p>
        <p className="text-[10px] text-slate-300 uppercase tracking-widest">
          Secure • Stateless • Simple
        </p>
      </footer>
    </div>
  );
}