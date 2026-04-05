import React from 'react';
import { PasswordForm } from './components/PasswordForm';
import { Lock, CheckCircle2, Github } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:p-6 font-sans text-slate-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* 极简背景装饰 - 仅保留微妙的渐变 */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 -z-10 transition-colors duration-300"></div>

      <header className="w-full max-w-lg mb-10 text-center space-y-5 animate-fade-in-up">
        {/* Removed Icon Section */}
        
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            确定性密码生成器
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">
            基于 HMAC-SHA256 的无状态保险箱
          </p>
        </div>
        
        <div className="flex justify-center flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700/60">
            <Lock size={12} className="text-slate-400 dark:text-slate-400" />
            <span>离线计算</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700/60">
            <CheckCircle2 size={12} className="text-slate-400 dark:text-slate-400" />
            <span>无云端存储</span>
          </div>
          <a 
            href="https://github.com/doofgice-ui/deterministic-vault" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700/60 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md transition-all cursor-pointer"
          >
            <Github size={12} />
            <span>已开源</span>
          </a>
        </div>
      </header>

      <main className="w-full max-w-[480px] animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <PasswordForm />
      </main>

      <footer className="mt-12 text-center space-y-3 opacity-60 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Deterministic Vault v4.8
        </p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest">
          Secure • Stateless • Simple
        </p>
        <a 
          href="https://github.com/doofgice-ui/deterministic-vault" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
        >
          <Github size={12} />
          <span>GitHub Repository</span>
        </a>
      </footer>
    </div>
  );
}