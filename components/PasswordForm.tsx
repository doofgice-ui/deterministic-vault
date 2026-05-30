import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Copy, Check, Key, User, Settings2, ArrowRight, X, Minus, Plus, Info, ShieldAlert, BrainCircuit, ChevronDown, History, Hash, ListRestart, Clipboard, Save, Lock, Unlock, Trash2, AlertTriangle, Search, Upload, Download, Moon, Sun, Fingerprint } from 'lucide-react';
import { generatePassword, generateRandomPassword, getServiceName, hashMasterKey, DEFAULT_PASSWORD_LENGTH, MAX_SAFE_LENGTH } from '../services/cryptoLogic';

const PREDEFINED_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
  '#14b8a6', // teal
];

const getIconText = (text: string) => {
  if (!text) return '';
  if (/[\u4e00-\u9fa5]/.test(text[0])) {
    return text.substring(0, 1);
  }
  return text.substring(0, 3).toUpperCase();
};

const getDefaultColor = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PREDEFINED_COLORS[Math.abs(hash) % PREDEFINED_COLORS.length];
};

export const PasswordForm: React.FC = () => {
  const [masterKey, setMasterKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [passwordLength, setPasswordLength] = useState(() => {
    const saved = localStorage.getItem('setting_passwordLength');
    return saved ? parseInt(saved, 10) : DEFAULT_PASSWORD_LENGTH;
  });
  
  // Character Options State
  const [useUpper, setUseUpper] = useState(() => {
    const saved = localStorage.getItem('setting_useUpper');
    return saved ? saved === 'true' : true;
  });
  const [useLower, setUseLower] = useState(() => {
    const saved = localStorage.getItem('setting_useLower');
    return saved ? saved === 'true' : true;
  });
  const [useNumbers, setUseNumbers] = useState(() => {
    const saved = localStorage.getItem('setting_useNumbers');
    return saved ? saved === 'true' : true;
  });
  const [useSymbols, setUseSymbols] = useState(() => {
    const saved = localStorage.getItem('setting_useSymbols');
    return saved ? saved === 'true' : true;
  });
  const [version, setVersion] = useState(() => {
    const saved = localStorage.getItem('setting_version');
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [generatedPass, setGeneratedPass] = useState('');
  const [displayedPass, setDisplayedPass] = useState(''); // For scramble effect
  const [serviceName, setServiceName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMaster, setShowMaster] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // State for info toggle

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('setting_isDarkMode');
    return saved ? saved === 'true' : false;
  });
  const [hideGeneratedPassword, setHideGeneratedPassword] = useState(() => {
    const saved = localStorage.getItem('setting_hideGeneratedPassword');
    return saved ? saved === 'true' : false;
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false); // State for history panel
  const [activeTab, setActiveTab] = useState<'generate' | 'vault' | 'settings'>('generate');
  const [isSavedUnlocked, setIsSavedUnlocked] = useState(false); // State for saved passwords unlock status
  const [autoLockCountdown, setAutoLockCountdown] = useState(60); // Auto lock countdown
  const [showNewVaultModal, setShowNewVaultModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [pendingSaveData, setPendingSaveData] = useState<{hash: string, accountId: string, generatedPass: string} | null>(null);
  const [unlockKey, setUnlockKey] = useState(''); // State for unlock master key input
  const [selectedVaultHash, setSelectedVaultHash] = useState<string | null>(null); // State for vault selection before unlock
  const [failedAttempts, setFailedAttempts] = useState<{[hash: string]: number}>({}); // Track failed attempts per vault
  const [cooldown, setCooldown] = useState(0); // Cooldown timer in seconds
  const [historyItems, setHistoryItems] = useState<{v: number, p: string}[]>([]);
  const [vaults, setVaults] = useState<{[hash: string]: {name: string, items: {accountId: string, password: string, timestamp: number, color?: string, iconText?: string}[]}}>({});
  const [currentVaultHash, setCurrentVaultHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);
  const [vaultToDeleteHash, setVaultToDeleteHash] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingIconText, setEditingIconText] = useState('');
  const [editingIconColor, setEditingIconColor] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const vaultLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const deletePressTimer = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [isEditingVaultName, setIsEditingVaultName] = useState(false);
  const [tempVaultName, setTempVaultName] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMasterFocused, setIsMasterFocused] = useState(false);
  const [obfuscatedDotCount, setObfuscatedDotCount] = useState(24);

  const [emailSuffixes, setEmailSuffixes] = useState<string[]>(() => {
    const saved = localStorage.getItem('emailSuffixes');
    return saved ? JSON.parse(saved) : ['@gmail.com', '@qq.com', '@163.com', '@outlook.com', '@icloud.com'];
  });
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  useEffect(() => {
    localStorage.setItem('emailSuffixes', JSON.stringify(emailSuffixes));
  }, [emailSuffixes]);

  useEffect(() => {
    localStorage.setItem('setting_hideGeneratedPassword', hideGeneratedPassword.toString());
  }, [hideGeneratedPassword]);

  useEffect(() => {
    const savedVaults = localStorage.getItem('passwordVaults');
    if (savedVaults) {
      setVaults(JSON.parse(savedVaults));
    } else {
      // Migration from old single list if exists
      const oldSaved = localStorage.getItem('savedPasswords');
      const oldHash = localStorage.getItem('masterKeyHash');
      if (oldSaved && oldHash) {
        const items = JSON.parse(oldSaved);
        const initialVaults = {
          [oldHash]: {
            name: items[0]?.accountId || '我的密码库',
            items: items
          }
        };
        setVaults(initialVaults);
        localStorage.setItem('passwordVaults', JSON.stringify(initialVaults));
        localStorage.removeItem('savedPasswords');
        localStorage.removeItem('masterKeyHash');
      }
    }
  }, []);

  useEffect(() => {
    if (accountId) {
      setServiceName(getServiceName(accountId));
    } else {
      setServiceName('');
    }
  }, [accountId]);

  useEffect(() => {
    localStorage.setItem('setting_passwordLength', passwordLength.toString());
    localStorage.setItem('setting_useUpper', useUpper.toString());
    localStorage.setItem('setting_useLower', useLower.toString());
    localStorage.setItem('setting_useNumbers', useNumbers.toString());
    localStorage.setItem('setting_useSymbols', useSymbols.toString());
    localStorage.setItem('setting_version', version.toString());

    localStorage.setItem('setting_isDarkMode', isDarkMode.toString());
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [passwordLength, useUpper, useLower, useNumbers, useSymbols, version, isDarkMode]);

  // Scramble Effect Logic
  const scrambleInterval = useRef<number | null>(null);
  
  const performScramble = (finalPass: string) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let iteration = 0;
    
    if (scrambleInterval.current) clearInterval(scrambleInterval.current);

    scrambleInterval.current = window.setInterval(() => {
      setDisplayedPass(prev => {
        return finalPass.split('')
          .map((char, index) => {
            if (index < iteration) return finalPass[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
      });

      if (iteration >= finalPass.length) { 
        if (scrambleInterval.current) clearInterval(scrambleInterval.current);
        setDisplayedPass(finalPass); // Ensure final state
      }
      
      iteration += 1/2; // Speed of reveal
    }, 30);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validation: ensure at least one type is selected
    if (!useUpper && !useLower && !useNumbers && !useSymbols) {
        showToast("请至少选择一种字符类型", "info");
        return;
    }

    // Determine mode: Deterministic (if inputs present) or Random (if inputs empty)
    const isDeterministic = masterKey && accountId;
    
    if (!isDeterministic && (masterKey || accountId)) {
        // Partially filled, do nothing (button disabled anyway)
        return;
    }

    setIsGenerating(true);
    setGeneratedPass(''); 
    setDisplayedPass('');

    try {
        let pass = '';
        if (isDeterministic) {
            pass = await generatePassword(masterKey, accountId, passwordLength, {
                useUpper,
                useLower,
                useNumbers,
                useSymbols,
                version
            });
        } else {
            // Random mode
            pass = generateRandomPassword(passwordLength, {
                useUpper,
                useLower,
                useNumbers,
                useSymbols,
                version: 1 // version doesn't matter for random
            });
        }
        
        // Wait a tiny bit to start the scramble visualization
        setTimeout(() => {
            setGeneratedPass(pass);
            setIsGenerating(false);
            performScramble(pass);
        }, 300);
        
    } catch (err) {
        console.error(err);
        setIsGenerating(false);
    }
  };

  const generateHistory = async () => {
    if (!masterKey || !accountId) {
        showToast("请先输入主密钥和账户标识", "info");
        return;
    }
    
    // Toggle off if already showing
    if (showHistory) {
        setShowHistory(false);
        return;
    }

    setShowHistory(true);
    const items = [];
    // Generate versions 1 through 10 (or current + 5 if current is high)
    const maxV = Math.max(10, version + 2);
    
    for (let v = 1; v <= maxV; v++) {
        const p = await generatePassword(masterKey, accountId, passwordLength, {
            useUpper, useLower, useNumbers, useSymbols, version: v
        });
        items.push({v, p});
    }
    setHistoryItems(items);
  };

  const savePassword = async () => {
    if (!generatedPass) return;
    
    if (!masterKey) {
      showToast("请先输入主密钥以保存密码", "info");
      return;
    }

    const hash = await hashMasterKey(masterKey);
    
    if (!vaults[hash]) {
      setPendingSaveData({ hash, accountId, generatedPass });
      setNewVaultName(accountId || '我的密码库');
      setShowNewVaultModal(true);
      return;
    }

    executeSavePassword(hash, generatedPass, accountId);
  };

  const executeSavePassword = (hash: string, pass: string, accId: string, vaultName?: string) => {
    const newVaults = { ...vaults };
    if (!newVaults[hash]) {
      newVaults[hash] = {
        name: vaultName || '我的密码库',
        items: []
      };
    }

    newVaults[hash].items.push({
      accountId: accId || '随机密码', 
      password: pass, 
      timestamp: Date.now()
    });

    setVaults(newVaults);
    localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
    showToast("密码已保存到库", "success");
  };

  const confirmNewVault = () => {
    if (pendingSaveData) {
      executeSavePassword(pendingSaveData.hash, pendingSaveData.generatedPass, pendingSaveData.accountId, newVaultName || '我的密码库');
      setPendingSaveData(null);
    }
    setShowNewVaultModal(false);
  };

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSavedUnlocked && activeTab === 'vault') {
      timer = setInterval(() => {
        setAutoLockCountdown((prev) => {
          if (prev <= 1) {
            setIsSavedUnlocked(false);
            setUnlockKey('');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoLockCountdown(60);
    }
    return () => clearInterval(timer);
  }, [isSavedUnlocked, activeTab]);

  const resetAutoLock = () => {
    if (isSavedUnlocked) {
      setAutoLockCountdown(60);
    }
  };

  const handleItemLongPressStart = (index: number) => {
    longPressTimer.current = setTimeout(() => {
      setItemToDeleteIndex(index);
      // Trigger haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 1000);
  };

  const handleItemLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleVaultLongPressStart = (hash: string) => {
    vaultLongPressTimer.current = setTimeout(() => {
      setVaultToDeleteHash(hash);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 1000);
  };

  const handleVaultLongPressEnd = () => {
    if (vaultLongPressTimer.current) {
      clearTimeout(vaultLongPressTimer.current);
      vaultLongPressTimer.current = null;
    }
  };

  const handleDeletePressStart = () => {
    if ((itemToDeleteIndex === null && vaultToDeleteHash === null) || (!currentVaultHash && !vaultToDeleteHash)) return;
    
    setDeleteProgress(0);
    const startTime = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 1000) * 100, 100);
      setDeleteProgress(progress);
    }, 10);

    deletePressTimer.current = setTimeout(() => {
      // Perform deletion
      const newVaults = { ...vaults };
      
      if (vaultToDeleteHash) {
        delete newVaults[vaultToDeleteHash];
        setVaults(newVaults);
        localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
        setVaultToDeleteHash(null);
        showToast("密码库已删除", "info");
      } else if (currentVaultHash && itemToDeleteIndex !== null) {
        newVaults[currentVaultHash].items = newVaults[currentVaultHash].items.filter((_, i) => i !== itemToDeleteIndex);
        
        if (newVaults[currentVaultHash].items.length === 0) {
          delete newVaults[currentVaultHash];
          setVaults(newVaults);
          localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
          closeSavedModal();
        } else {
          setVaults(newVaults);
          localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
        }
        setItemToDeleteIndex(null);
        showToast("密码已删除", "info");
      }
      
      clearInterval(progressInterval.current!);
      setDeleteProgress(0);
      
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
    }, 1000);
  };

  const handleDeletePressEnd = () => {
    if (deletePressTimer.current) {
      clearTimeout(deletePressTimer.current);
      deletePressTimer.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setDeleteProgress(0);
  };

  const handleUnlock = async () => {
    if (!unlockKey || !selectedVaultHash || cooldown > 0) return;
    const hash = await hashMasterKey(unlockKey);
    
    if (hash === selectedVaultHash) {
      setCurrentVaultHash(hash);
      setIsSavedUnlocked(true);
      setTempVaultName(vaults[hash].name);
      // Reset failed attempts on success
      setFailedAttempts(prev => ({ ...prev, [selectedVaultHash]: 0 }));
    } else {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const newAttempts = (failedAttempts[selectedVaultHash] || 0) + 1;
      
      if (newAttempts >= 5) {
        // Delete vault after 5 failed attempts
        const newVaults = { ...vaults };
        delete newVaults[selectedVaultHash];
        setVaults(newVaults);
        localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
        
        showToast("连续5次错误，该库已被强制删除", "info");
        setSelectedVaultHash(null);
        setUnlockKey('');
        setFailedAttempts(prev => {
          const updated = { ...prev };
          delete updated[selectedVaultHash];
          return updated;
        });
      } else {
        setFailedAttempts(prev => ({ ...prev, [selectedVaultHash]: newAttempts }));
        setCooldown(3); // 3 seconds cooldown
        showToast(`主密钥错误，剩余尝试次数: ${5 - newAttempts}`, "info");
      }
    }
  };

  const updateVaultName = () => {
    if (!currentVaultHash || !tempVaultName.trim()) return;
    const newVaults = { ...vaults };
    newVaults[currentVaultHash].name = tempVaultName.trim();
    setVaults(newVaults);
    localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
    setIsEditingVaultName(false);
    showToast("库名称已更新", "success");
  };

  const getVisualLength = (str: string) => {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 255) {
        len += 2;
      } else {
        len += 1;
      }
    }
    return len;
  };

  const handleIconTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (getVisualLength(val) <= 4) {
      setEditingIconText(val);
    }
  };

  const saveItemIcon = () => {
    if (!currentVaultHash || editingItemIndex === null) return;
    const newVaults = { ...vaults };
    newVaults[currentVaultHash].items[editingItemIndex].color = editingIconColor;
    newVaults[currentVaultHash].items[editingItemIndex].iconText = editingIconText;
    setVaults(newVaults);
    localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
    setEditingItemIndex(null);
  };

  const closeSavedModal = () => {
    setActiveTab('generate');
    setIsSavedUnlocked(false);
    setCurrentVaultHash(null);
    setSelectedVaultHash(null);
    setUnlockKey('');
    setIsEditingVaultName(false);
    setSearchQuery('');
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    showToast("密码已复制到剪贴板", "success");
  };

  const showToast = (msg: string, type: 'success' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportCSV = () => {
    if (!currentVaultHash) return;
    const vault = vaults[currentVaultHash];
    const header = ['Account ID', 'Password', 'Icon Text', 'Color', 'Timestamp'];
    const rows = vault.items.map(item => [
      `"${item.accountId.replace(/"/g, '""')}"`,
      `"${item.password.replace(/"/g, '""')}"`,
      `"${(item.iconText || '').replace(/"/g, '""')}"`,
      `"${item.color || ''}"`,
      item.timestamp
    ]);
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${vault.name}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("导出成功", "success");
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

    let accIdx = headers.findIndex(h => h === 'account id' || h === 'username' || h === 'login_username' || h === 'name' || h === 'url' || h === 'account');
    let passIdx = headers.findIndex(h => h === 'password' || h === 'login_password');
    let iconTextIdx = headers.findIndex(h => h === 'icon text');
    let colorIdx = headers.findIndex(h => h === 'color');

    if (accIdx === -1) accIdx = 0;
    if (passIdx === -1) passIdx = 1;

    const newItems: {accountId: string, password: string, iconText?: string, color?: string, timestamp: number}[] = [];
    for (let i = 1; i < lines.length; i++) {
       const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, ''));
       if (row[accIdx] && row[passIdx]) {
          newItems.push({
            accountId: row[accIdx],
            password: row[passIdx],
            iconText: iconTextIdx !== -1 && row[iconTextIdx] ? row[iconTextIdx] : undefined,
            color: colorIdx !== -1 && row[colorIdx] ? row[colorIdx] : undefined,
            timestamp: Date.now()
          });
       }
    }
    return newItems;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentVaultHash) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const importedItems = parseCSV(text);

      if (importedItems.length > 0) {
        const newVaults = { ...vaults };
        const currentItems = [...newVaults[currentVaultHash].items];

        let addedCount = 0;
        importedItems.forEach(newItem => {
          const existingIdx = currentItems.findIndex(item => item.accountId === newItem.accountId);
          if (existingIdx !== -1) {
            currentItems[existingIdx] = { ...currentItems[existingIdx], ...newItem };
          } else {
            currentItems.push(newItem);
            addedCount++;
          }
        });

        newVaults[currentVaultHash].items = currentItems.sort((a, b) => b.timestamp - a.timestamp);
        setVaults(newVaults);
        localStorage.setItem('passwordVaults', JSON.stringify(newVaults));
        showToast(`成功导入 ${importedItems.length} 条记录 (新增 ${addedCount} 条)`, "success");
      } else {
        showToast("未找到有效的密码记录", "info");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adjustLength = (delta: number) => {
    setPasswordLength(prev => {
        const newVal = prev + delta;
        if (newVal < 4) return 4;
        if (newVal > MAX_SAFE_LENGTH) return MAX_SAFE_LENGTH;
        return newVal;
    });
  };

  const adjustVersion = (delta: number) => {
      setVersion(prev => {
          const newVal = prev + delta;
          if (newVal < 1) return 1;
          if (newVal > 99) return 99;
          return newVal;
      });
  };

  const appendSuffix = (suffix: string) => {
    setAccountId(prev => {
        if (!prev) return suffix;
        // Avoid double @ if user already typed it at the end
        if (prev.endsWith('@') && suffix.startsWith('@')) {
            return prev + suffix.substring(1);
        }
        return prev + suffix;
    });
  };

  const addEmailSuffix = () => {
    if (!newTagValue.trim()) return;
    let tag = newTagValue.trim();
    if (!emailSuffixes.includes(tag)) {
      setEmailSuffixes([...emailSuffixes, tag]);
    }
    setNewTagValue('');
  };

  const saveEditedTag = () => {
    if (editingTagIndex === null || !editingTagValue.trim()) return;
    let tag = editingTagValue.trim();
    
    const newSuffixes = [...emailSuffixes];
    newSuffixes[editingTagIndex] = tag;
    // Remove duplicates if any
    setEmailSuffixes(Array.from(new Set(newSuffixes)));
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const deleteEmailSuffix = (index: number) => {
    const newSuffixes = [...emailSuffixes];
    newSuffixes.splice(index, 1);
    setEmailSuffixes(newSuffixes);
  };

  // WebAuthn PRF (Passkey) Integration
  const [hasPasskey, setHasPasskey] = useState(() => {
    return !!localStorage.getItem('passkey_id');
  });

  const getPrfSalt = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode("Deterministic Vault PRF Salt v1");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  };

  const registerPasskey = async () => {
    if (!window.PublicKeyCredential) {
      showToast("您的浏览器不支持通行密钥", "info");
      return;
    }
    
    try {
      const salt = await getPrfSalt();
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const publicKey: any = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Deterministic Vault", id: window.location.hostname },
        user: {
          id: userId,
          name: "vault-user",
          displayName: "Vault User"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: {
          userVerification: "required",
          authenticatorAttachment: "platform",
        },
        extensions: {
          prf: {
            eval: { first: salt }
          }
        }
      };

      const cred = await navigator.credentials.create({ publicKey }) as any;
      if (!cred) return;

      const rawIdBase64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
      localStorage.setItem('passkey_id', rawIdBase64);
      setHasPasskey(true);
      
      const extResults = cred.getClientExtensionResults();
      if (extResults.prf && extResults.prf.enabled) {
        if (extResults.prf.results && extResults.prf.results.first) {
          const prfKey = new Uint8Array(extResults.prf.results.first);
          const base64Key = btoa(String.fromCharCode(...prfKey));
          setMasterKey(base64Key);
          showToast("通行密钥注册成功，已生成主密钥", "success");
        } else {
          showToast("通行密钥注册成功，但未能立即获取派生密钥，请重试解锁", "info");
        }
      } else {
        showToast("您的设备/浏览器不支持 PRF 扩展，无法派生密钥", "info");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('not enabled in this document')) {
        showToast("预览窗口不支持指纹，请点击右上角「在新标签页中打开」使用此功能", "info");
      } else {
        showToast("注册失败: " + (e.message || "未知错误"), "info");
      }
    }
  };

  const authenticatePasskey = async () => {
    if (!window.PublicKeyCredential) {
      showToast("您的浏览器不支持通行密钥", "info");
      return;
    }

    try {
      const salt = await getPrfSalt();
      const rawIdBase64 = localStorage.getItem('passkey_id');
      
      let allowCredentials = [];
      if (rawIdBase64) {
        const binaryString = atob(rawIdBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        allowCredentials = [{
          id: bytes,
          type: "public-key"
        }];
      }

      const publicKey: any = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: "required",
        extensions: {
          prf: {
            eval: { first: salt }
          }
        }
      };

      const assertion = await navigator.credentials.get({ publicKey }) as any;
      if (!assertion) return;

      const extResults = assertion.getClientExtensionResults();
      if (extResults.prf && extResults.prf.results && extResults.prf.results.first) {
        const prfKey = new Uint8Array(extResults.prf.results.first);
        const base64Key = btoa(String.fromCharCode(...prfKey));
        setMasterKey(base64Key);
        showToast("指纹解锁成功", "success");
      } else {
        showToast("未能获取派生密钥，设备可能不支持 PRF", "info");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('not enabled in this document')) {
        showToast("预览窗口不支持指纹，请点击右上角「在新标签页中打开」使用此功能", "info");
      } else {
        showToast("解锁失败: " + (e.message || "未知错误"), "info");
      }
    }
  };

  const handlePasskeyAction = () => {
    if (hasPasskey) {
      authenticatePasskey();
    } else {
      registerPasskey();
    }
  };

  // Improved Strength Calculation
  const getStrength = (pass: string) => {
    const len = pass.length;
    if (len === 0) return 0;
    
    let types = 0;
    if (/[a-z]/.test(pass)) types++;
    if (/[A-Z]/.test(pass)) types++;
    if (/[0-9]/.test(pass)) types++;
    if (/[^A-Za-z0-9]/.test(pass)) types++;

    if (len >= 20) return 4; 
    if (len >= 15) return 3;
    if (len < 8) return 1; 
    if (len < 14 && types === 1) return 1;
    if ((len >= 12 && types >= 3) || (len >= 10 && types === 4)) return 4;
    if (len >= 10 && types >= 2) return 3;
    return 2;
  };

  const strength = getStrength(masterKey);

  const getStrengthLabel = (s: number) => {
      switch(s) {
          case 1: return '太短或简单';
          case 2: return '强度一般';
          case 3: return '强度良好';
          case 4: return '强度极佳';
          default: return '';
      }
  };

  const getStrengthColor = (s: number) => {
      if (s <= 1) return 'bg-red-500';
      if (s === 2) return 'bg-orange-400';
      if (s === 3) return 'bg-blue-400';
      return 'bg-green-500';
  };

  const getStrengthTextColor = (s: number) => {
      if (s <= 1) return 'text-red-600 bg-red-50';
      if (s === 2) return 'text-orange-600 bg-orange-50';
      if (s === 3) return 'text-blue-600 bg-blue-50';
      return 'text-green-600 bg-green-50';
  };

  const hasAnyOption = useUpper || useLower || useNumbers || useSymbols;

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-visible transition-colors duration-300">
      
      {/* Icon Customization Modal */}
      <AnimatePresence>
      {editingItemIndex !== null && currentVaultHash && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" 
          onClick={() => setEditingItemIndex(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 text-center">自定义图标</h3>
              
              <div className="flex justify-center mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md transition-colors"
                  style={{ backgroundColor: editingIconColor }}
                >
                  {editingIconText || getIconText(vaults[currentVaultHash].items[editingItemIndex].accountId)}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">图标文字 (中文最多2字，英文最多4字)</label>
                <input
                  type="text"
                  value={editingIconText}
                  onChange={handleIconTextChange}
                  placeholder={getIconText(vaults[currentVaultHash].items[editingItemIndex].accountId)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-center font-bold"
                />
              </div>

              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">图标颜色</label>
              <div className="grid grid-cols-5 gap-3 mb-6">
                {PREDEFINED_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditingIconColor(color)}
                    className={`w-10 h-10 rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-offset-slate-800 ${editingIconColor === color ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-200 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingItemIndex(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveItemIcon}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Edit Tags Modal */}
      <AnimatePresence>
      {isEditingTags && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" 
          onClick={() => { setIsEditingTags(false); setEditingTagIndex(null); }}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[80vh]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">自定义标签管理</h3>
              <button onClick={() => { setIsEditingTags(false); setEditingTagIndex(null); }} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3">
              {emailSuffixes.map((suffix, index) => (
                <div key={index} className="flex items-center gap-2">
                  {editingTagIndex === index ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTagValue}
                        onChange={(e) => setEditingTagValue(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg py-2 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEditedTag()}
                      />
                      <button
                        onClick={saveEditedTag}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingTagIndex(null)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{suffix}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingTagIndex(index); setEditingTagValue(suffix); }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteEmailSuffix(index)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {emailSuffixes.length === 0 && (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">暂无标签</p>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">添加新标签</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="输入自定义标签，如 @gmail.com 或 admin"
                  className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && addEmailSuffix()}
                />
                <button
                  onClick={addEmailSuffix}
                  disabled={!newTagValue.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20 dark:shadow-blue-900/20"
                >
                  添加
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
      {(itemToDeleteIndex !== null || vaultToDeleteHash !== null) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {vaultToDeleteHash ? '确认删除整个密码库？' : '确认删除密码？'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {vaultToDeleteHash ? (
                    <>您正在删除密码库 <span className="font-bold text-slate-700 dark:text-slate-300">{vaults[vaultToDeleteHash].name}</span>。库中包含的所有密码都将被永久移除。</>
                  ) : (
                    <>您正在删除 <span className="font-bold text-slate-700 dark:text-slate-300">{currentVaultHash && vaults[currentVaultHash].items[itemToDeleteIndex!].accountId}</span> 的密码。</>
                  )}
                  <br />此操作不可撤销。
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <div className="relative group">
                  <button
                    onMouseDown={handleDeletePressStart}
                    onMouseUp={handleDeletePressEnd}
                    onMouseLeave={handleDeletePressEnd}
                    onTouchStart={handleDeletePressStart}
                    onTouchEnd={handleDeletePressEnd}
                    className="w-full py-4 bg-red-500 dark:bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 overflow-hidden relative active:scale-[0.98] transition-all"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-red-600 dark:bg-red-700 transition-all duration-75 ease-linear pointer-events-none"
                      style={{ width: `${deleteProgress}%` }}
                    />
                    <Trash2 size={20} className="relative z-10" />
                    <span className="relative z-10">长按 1 秒确认删除</span>
                  </button>
                  {deleteProgress > 0 && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-2 animate-pulse">
                      松开即取消删除...
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => { setItemToDeleteIndex(null); setVaultToDeleteHash(null); }}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
          <div className="absolute top-[-60px] left-0 right-0 flex justify-center animate-fade-in-up z-50">
              <div className="bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                  {toast.type === 'success' && <Check size={16} className="text-green-400" />}
                  {toast.msg}
              </div>
          </div>
      )}

      {/* Tab Content Area with Fixed Height */}
      <div className="h-[580px] overflow-y-auto no-scrollbar flex flex-col">
        {/* Tab Content: Generate */}
        <div className={activeTab === 'generate' ? 'block' : 'hidden'}>
        {/* Output Area */}
        <div className={`transition-all duration-300 rounded-t-3xl ${generatedPass ? 'bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 p-6' : 'bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-6'}`}>
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">生成的密码</span>
                {version > 1 && masterKey && accountId && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        V{version}
                    </span>
                )}
            </div>
            <div className="relative flex items-center justify-between">
                <div className="flex-1 overflow-hidden mr-4 h-10 flex items-center">
                     {(displayedPass || isGenerating) ? (
                         <code className="block font-mono text-2xl sm:text-3xl text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap overflow-x-auto no-scrollbar selection:bg-blue-100 dark:selection:bg-blue-900">
                            {hideGeneratedPassword ? "•".repeat(passwordLength) : (displayedPass || "•".repeat(passwordLength))}
                         </code>
                     ) : (
                         <div className="text-2xl sm:text-3xl text-slate-300 dark:text-slate-600 font-mono tracking-tight select-none">••••••••••••</div>
                     )}
                </div>
                
                <div className="flex gap-2">
                    <button
                      onClick={() => savePassword()}
                      disabled={!generatedPass}
                      className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200
                        ${generatedPass 
                            ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95'
                            : 'bg-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <Save size={20} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(generatedPass)}
                      disabled={!generatedPass}
                      className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200
                        ${generatedPass 
                            ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95'
                            : 'bg-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        {copiedText === generatedPass ? <Check size={20} className="text-green-500 dark:text-green-400" /> : <Copy size={20} />}
                    </button>
                </div>
            </div>
            
            <div className={`flex gap-2 mt-2 transition-opacity duration-300 ${generatedPass ? 'opacity-100' : 'opacity-0'}`}>
                {/* Character Type Indicators */}
                <div className="flex gap-1.5">
                    {useLower && <Indicator active={/[a-z]/.test(generatedPass)} label="abc" />}
                    {useUpper && <Indicator active={/[A-Z]/.test(generatedPass)} label="ABC" />}
                    {useNumbers && <Indicator active={/[0-9]/.test(generatedPass)} label="123" />}
                    {useSymbols && <Indicator active={/[!@#$%^&*]/.test(generatedPass)} label="#$%" />}
                </div>
            </div>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="p-6 sm:p-8 space-y-6">
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImportCSV} 
        />
        
        {/* Master Key */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-1.5">
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                 主密钥
               </label>
               <button 
                  type="button" 
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-0.5 rounded-full transition-colors ${showInfo ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50' : 'text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400'}`}
               >
                 <Info size={14} />
               </button>
             </div>
             {masterKey && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${getStrengthTextColor(strength)}`}>
                    {getStrengthLabel(strength)}
                </span>
             )}
          </div>

          {/* Collapsible Info Box */}
          <div className={`overflow-hidden transition-all duration-300 ease-out ${showInfo ? 'max-h-[500px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg p-4 text-xs text-slate-600 dark:text-slate-400 space-y-4">
                 <div className="space-y-2">
                     <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                         <BrainCircuit size={16} className="text-blue-500 dark:text-blue-400" />
                         使用方法
                     </h4>
                     <ul className="list-disc pl-5 space-y-1.5">
                         <li><strong className="text-slate-700 dark:text-slate-300">设定主密钥：</strong>想一个只有您知道的复杂密码作为主密钥。</li>
                         <li><strong className="text-slate-700 dark:text-slate-300">输入账户标识：</strong>输入您要登录的网站或应用名称（如：taobao、微信）。</li>
                         <li><strong className="text-slate-700 dark:text-slate-300">生成密码：</strong>系统会根据主密钥和账户标识，通过加密算法生成一个唯一的复杂密码。</li>
                         <li><strong className="text-slate-700 dark:text-slate-300">一致性：</strong>只要主密钥和账户标识相同，每次生成的密码都完全一样。</li>
                     </ul>
                 </div>
                 
                 <div className="space-y-2">
                     <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                         <ShieldAlert size={16} className="text-orange-500 dark:text-orange-400" />
                         注意事项
                     </h4>
                     <ul className="list-disc pl-5 space-y-1.5">
                         <li><strong className="text-slate-700 dark:text-slate-300">牢记主密钥：</strong>主密钥是恢复所有密码的唯一凭证，<span className="text-red-500 dark:text-red-400 font-bold">一旦遗忘，将无法找回任何密码！</span></li>
                         <li><strong className="text-slate-700 dark:text-slate-300">离线安全：</strong>本应用所有计算均在本地浏览器完成，绝不会上传您的主密钥或生成的密码。</li>
                         <li><strong className="text-slate-700 dark:text-slate-300">密码库备份：</strong>密码库仅保存在本地浏览器中，清除浏览器缓存会导致记录丢失，建议定期导出 CSV 备份。</li>
                     </ul>
                 </div>
              </div>
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400">
                <Key size={18} />
            </div>
            <input
              type={showMaster ? "text" : "password"}
              value={isMasterFocused || showMaster ? masterKey : (masterKey ? "•".repeat(obfuscatedDotCount) : "")}
              onFocus={() => setIsMasterFocused(true)}
              onBlur={() => {
                setIsMasterFocused(false);
                if (masterKey) {
                  // Generate a random length between 16 and 28
                  const randomLen = Math.floor(Math.random() * 13) + 16;
                  setObfuscatedDotCount(randomLen);
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                setMasterKey(val);
                if (!val) setShowInfo(false); // Auto hide info if cleared, optional UX preference
              }}
              placeholder="您的秘密主密码"
              autoComplete="off"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-28 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-medium"
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 {masterKey && (
                    <button
                        type="button"
                        onClick={() => setMasterKey('')}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        tabIndex={-1}
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                 )}
                 {window.PublicKeyCredential && (
                    <button
                        type="button"
                        onClick={handlePasskeyAction}
                        title={hasPasskey ? "使用指纹解锁" : "注册指纹通行密钥"}
                        className={`p-1.5 rounded-lg transition-colors ${hasPasskey ? 'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <Fingerprint size={18} />
                    </button>
                 )}
                <button
                type="button"
                onClick={() => setShowMaster(!showMaster)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                {showMaster ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>
          
          {/* Strength Bars */}
          <div className="flex gap-1 h-1 px-1 pt-1">
             {[1, 2, 3, 4].map((level) => {
                 const active = strength >= level;
                 return (
                     <div 
                        key={level} 
                        className={`flex-1 rounded-full transition-colors duration-300 ${active ? getStrengthColor(strength) : 'bg-slate-100 dark:bg-slate-700'}`} 
                     />
                 )
             })}
          </div>
        </div>

        {/* Account ID */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            账户标识
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400">
              <User size={18} />
            </div>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="例如: google+谷歌账号，或qq+QQ账号"
              autoComplete="off"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-24 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-medium"
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 {accountId && !serviceName && (
                    <button
                        type="button"
                        onClick={() => setAccountId('')}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        tabIndex={-1}
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                 )}
                 {serviceName && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAccountId('')}
                            className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            tabIndex={-1}
                        >
                             <X size={14} strokeWidth={3} />
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            {serviceName}
                        </span>
                    </div>
                )}
            </div>
          </div>
          
          {/* Email Suffix Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-1 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {emailSuffixes.map(suffix => (
                <button
                    key={suffix}
                    type="button"
                    onClick={() => appendSuffix(suffix)}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50 transition-all active:scale-95"
                >
                    {suffix}
                </button>
            ))}
            <button
                type="button"
                onClick={() => setIsEditingTags(true)}
                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center"
                title="自定义标签管理"
            >
                <Settings2 size={12} />
            </button>
          </div>
        </div>



        {/* Action Button */}
        <button
          type="submit"
          disabled={((masterKey && !accountId) || (!masterKey && accountId)) || !hasAnyOption}
          className={`w-full group relative h-14 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2
            ${(((masterKey && !accountId) || (!masterKey && accountId)) || !hasAnyOption) 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
              : (!masterKey && !accountId) 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/30 hover:shadow-emerald-500/40 dark:hover:shadow-emerald-900/40 transform active:scale-[0.98]'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 dark:shadow-blue-900/30 hover:shadow-blue-500/40 dark:hover:shadow-blue-900/40 transform active:scale-[0.98]'
            }`}
        >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span>计算中...</span>
              </div>
            ) : (
               <>
                 <span>{(!masterKey && !accountId) ? '生成随机密码' : '生成密码'}</span>
                 {!(((masterKey && !accountId) || (!masterKey && accountId)) || !hasAnyOption) && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
               </>
            )}
        </button>
      </form>
      </div>

      {/* Tab Content: Vault */}
      <div 
        className={activeTab === 'vault' ? 'block' : 'hidden'}
        onMouseMove={resetAutoLock}
        onKeyDown={resetAutoLock}
        onClick={resetAutoLock}
      >
        <div className="w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        {isSavedUnlocked ? <Unlock size={20} className="text-green-500 dark:text-green-400" /> : <Lock size={20} className="text-blue-500 dark:text-blue-400" />}
                        {isSavedUnlocked && currentVaultHash ? (
                            <div className="flex items-center gap-2">
                                {isEditingVaultName ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={tempVaultName}
                                            onChange={(e) => setTempVaultName(e.target.value)}
                                            className="text-sm font-bold bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-800/50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-slate-800 dark:text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && updateVaultName()}
                                        />
                                        <button onClick={updateVaultName} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={() => { setIsEditingVaultName(false); setTempVaultName(vaults[currentVaultHash].name); }} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{vaults[currentVaultHash].name}</h3>
                                        <button onClick={() => setIsEditingVaultName(true)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="编辑库名称">
                                            <Settings2 size={14} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                        <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400" title="导入 CSV">
                                            <Upload size={14} />
                                        </button>
                                        <button onClick={handleExportCSV} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400" title="导出 CSV">
                                            <Download size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                {selectedVaultHash ? vaults[selectedVaultHash].name : '选择密码库'}
                            </h3>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isSavedUnlocked && (
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                {autoLockCountdown}s 后锁定
                            </span>
                        )}
                        {selectedVaultHash && !isSavedUnlocked && (
                            <button 
                                onClick={() => { setSelectedVaultHash(null); setUnlockKey(''); setSearchQuery(''); }}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                            >
                                返回列表
                            </button>
                        )}
                        <button onClick={closeSavedModal} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                    {!isSavedUnlocked ? (
                        !selectedVaultHash ? (
                            <motion.div 
                                key="vault-list"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-3 pr-2"
                            >
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">可用密码库</p>
                                {Object.keys(vaults).map((hash, index) => {
                                    const vault = vaults[hash];
                                    return (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            key={hash}
                                            onClick={() => setSelectedVaultHash(hash)}
                                            onMouseDown={() => handleVaultLongPressStart(hash)}
                                            onMouseUp={handleVaultLongPressEnd}
                                            onMouseLeave={handleVaultLongPressEnd}
                                            onTouchStart={() => handleVaultLongPressStart(hash)}
                                            onTouchEnd={handleVaultLongPressEnd}
                                            onContextMenu={(e) => e.preventDefault()}
                                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-600 group-hover:border-blue-100 dark:group-hover:border-blue-800/50 transition-colors">
                                                    <Lock size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{vault.name}</h4>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{vault.items.length} 个已保存密码</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="unlock-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0], opacity: 1 } : { opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={isShaking ? { duration: 0.4 } : {}}
                                className="space-y-4"
                            >
                                <div className="text-center space-y-2">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${cooldown > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 animate-pulse' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                                        {cooldown > 0 ? <ShieldAlert size={24} /> : <Key size={24} />}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">请输入库对应的主密钥以解锁</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold tracking-wider">{vaults[selectedVaultHash].name}</p>
                                </div>

                                {failedAttempts[selectedVaultHash] > 0 && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl space-y-1">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                            <ShieldAlert size={14} />
                                            <span className="text-xs font-bold">安全警告</span>
                                        </div>
                                        <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                                            剩余尝试次数: <span className="font-bold">{5 - failedAttempts[selectedVaultHash]}</span>。
                                            连续 5 次错误将<span className="font-bold">永久删除</span>此库的所有密码。
                                        </p>
                                    </div>
                                )}

                                <div className="relative">
                                    <input
                                        type="password"
                                        value={unlockKey}
                                        onChange={(e) => setUnlockKey(e.target.value)}
                                        placeholder={cooldown > 0 ? `冷却中 (${cooldown}s)` : "主密钥"}
                                        disabled={cooldown > 0}
                                        className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl py-3 px-4 text-slate-800 dark:text-slate-200 focus:outline-none transition-all ${
                                            cooldown > 0 
                                            ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10 cursor-not-allowed text-red-400 dark:text-red-500' 
                                            : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400'
                                        }`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleUnlock}
                                    disabled={cooldown > 0 || !unlockKey}
                                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${
                                        cooldown > 0 
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 dark:shadow-blue-900/20'
                                    }`}
                                >
                                    {cooldown > 0 ? `请等待 ${cooldown} 秒` : '解锁'}
                                </button>
                            </motion.div>
                        )
                    ) : (
                        <motion.div 
                            key="password-list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex flex-col h-full"
                        >
                            {/* Search Bar */}
                            <div className="mb-4 relative shrink-0">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索账户标识..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-8 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Password List */}
                            <div className="space-y-3 pr-2">
                                <AnimatePresence>
                                {currentVaultHash && vaults[currentVaultHash].items
                                    .map((item, originalIndex) => ({ item, originalIndex }))
                                    .filter(({ item }) => item.accountId.toLowerCase().includes(searchQuery.toLowerCase()) || (item.iconText || getIconText(item.accountId)).toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(({ item, originalIndex }, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={originalIndex} 
                                        className="group relative flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all cursor-pointer active:scale-[0.98]"
                                        onMouseDown={() => handleItemLongPressStart(originalIndex)}
                                        onMouseUp={handleItemLongPressEnd}
                                        onMouseLeave={handleItemLongPressEnd}
                                        onTouchStart={() => handleItemLongPressStart(originalIndex)}
                                        onTouchEnd={handleItemLongPressEnd}
                                        onContextMenu={(e) => e.preventDefault()}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm transition-transform hover:scale-105"
                                                style={{ backgroundColor: item.color || getDefaultColor(item.accountId) }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItemIndex(originalIndex);
                                                    setEditingIconText(item.iconText || '');
                                                    setEditingIconColor(item.color || getDefaultColor(item.accountId));
                                                }}
                                                title="点击自定义图标"
                                            >
                                                {item.iconText || getIconText(item.accountId)}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1 truncate">{item.accountId}</span>
                                                <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 truncate">{hideGeneratedPassword ? "•".repeat(12) : item.password}</code>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyToClipboard(item.password);
                                                }}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                                title="复制密码"
                                            >
                                                {copiedText === item.password ? <Check size={16} className="text-green-500 dark:text-green-400" /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                                {currentVaultHash && vaults[currentVaultHash].items.filter(item => item.accountId.toLowerCase().includes(searchQuery.toLowerCase()) || (item.iconText || getIconText(item.accountId)).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm"
                                    >
                                        没有找到匹配的密码
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
                
                {isSavedUnlocked && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                            安全提示：查看完毕后请及时关闭
                        </p>
                    </div>
                )}
            </div>
        </div>
      {/* Tab Content: Settings */}
      <div className={activeTab === 'settings' ? 'block p-6 sm:p-8 space-y-6' : 'hidden'}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">设置</h3>
          <div className="space-y-6">
              {/* 1. Length Slider */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                          <Hash size={16} />
                          <span>密码长度</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                              type="button"
                              onClick={() => adjustLength(-1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                          >
                              <Minus size={12} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                              {passwordLength}
                          </span>
                          <button 
                              type="button"
                              onClick={() => adjustLength(1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                          >
                              <Plus size={12} strokeWidth={3} />
                          </button>
                      </div>
                  </div>
                  
                  <input 
                      type="range" 
                      min="4" 
                      max={MAX_SAFE_LENGTH} 
                      value={passwordLength} 
                      onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                  />
              </div>

              {/* 2. Character Types */}
              <div>
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2.5">包含字符</div>
                  <div className="grid grid-cols-4 gap-2">
                      <ToggleOption 
                          active={useUpper} 
                          onClick={() => setUseUpper(!useUpper)} 
                          label="ABC" 
                      />
                      <ToggleOption 
                          active={useLower} 
                          onClick={() => setUseLower(!useLower)} 
                          label="abc" 
                      />
                      <ToggleOption 
                          active={useNumbers} 
                          onClick={() => setUseNumbers(!useNumbers)} 
                          label="123" 
                      />
                      <ToggleOption 
                          active={useSymbols} 
                          onClick={() => setUseSymbols(!useSymbols)} 
                          label="#$&" 
                      />
                  </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                      <span>暗色主题</span>
                  </div>
                  <button
                      type="button"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${isDarkMode ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                  >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>

              {/* Hide Generated Password Toggle */}
              <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {hideGeneratedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>隐藏生成的密码</span>
                  </div>
                  <button
                      type="button"
                      onClick={() => setHideGeneratedPassword(!hideGeneratedPassword)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${hideGeneratedPassword ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                  >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideGeneratedPassword ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>

              {/* 3. Password Version (Rotation) - Only for Deterministic Mode */}
              {(masterKey && accountId) && (
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                              <History size={16} />
                              <span>密码版本</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button 
                                  type="button"
                                  onClick={() => adjustVersion(-1)}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                              >
                                  <Minus size={12} strokeWidth={3} />
                              </button>
                              <span className="w-8 text-center text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                                  v{version}
                              </span>
                              <button 
                                  type="button"
                                  onClick={() => adjustVersion(1)}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
                              >
                                  <Plus size={12} strokeWidth={3} />
                              </button>
                          </div>
                      </div>
                      
                      <input 
                          type="range" 
                          min="1" 
                          max="20" 
                          value={version} 
                          onChange={(e) => setVersion(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                      />
                      
                      {/* History Trigger */}
                      <div className="pt-2 flex justify-end">
                          <button
                              type="button"
                              onClick={generateHistory}
                              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all"
                          >
                              <ListRestart size={12} />
                              <span>{showHistory ? '收起历史版本' : '忘记版本？找回历史密码'}</span>
                          </button>
                      </div>

                      {/* History Panel */}
                      <div className={`overflow-hidden transition-all duration-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${showHistory ? 'max-h-[300px] mt-2' : 'max-h-0 border-none'}`}>
                          <div className="p-2 overflow-y-auto max-h-[300px] space-y-1">
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-2 py-1 uppercase tracking-wide">
                                  历史版本速查 (V1 - V{Math.max(10, version + 2)})
                              </div>
                              {historyItems.map((item) => (
                                  <div key={item.v} className={`flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 ${item.v === version ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50' : ''}`}>
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          <span className={`text-xs font-bold w-6 text-center ${item.v === version ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                              V{item.v}
                                          </span>
                                          <code className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                                              {hideGeneratedPassword ? "•".repeat(passwordLength) : item.p}
                                          </code>
                                      </div>
                                      <button 
                                          onClick={() => copyToClipboard(item.p)}
                                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                                      >
                                          {copiedText === item.p ? <Check size={14} className="text-green-500 dark:text-green-400" /> : <Clipboard size={14} />}
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-3xl p-2 flex justify-around">
        <button onClick={() => setActiveTab('generate')} className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-1 ${activeTab === 'generate' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
          <Key size={20} />
          <span className="text-[10px] font-bold mt-1">生成</span>
        </button>
        <button onClick={() => setActiveTab('vault')} className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-1 ${activeTab === 'vault' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
          <ShieldAlert size={20} />
          <span className="text-[10px] font-bold mt-1">密码库</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-1 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
          <Settings2 size={20} />
          <span className="text-[10px] font-bold mt-1">设置</span>
        </button>
      </div>
      {/* New Vault Modal */}
      <AnimatePresence>
      {showNewVaultModal && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">创建新密码库</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">这是您第一次使用该主密钥保存密码，请为这个密码库命名。</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">密码库名称</label>
                        <input
                            type="text"
                            value={newVaultName}
                            onChange={(e) => setNewVaultName(e.target.value)}
                            placeholder="例如: 我的工作密码库"
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmNewVault()}
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        onClick={() => { setShowNewVaultModal(false); setPendingSaveData(null); }}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={confirmNewVault}
                        disabled={!newVaultName.trim()}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20 dark:shadow-blue-900/20"
                    >
                        确认保存
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

const ToggleOption: React.FC<{active: boolean, onClick: () => void, label: string}> = ({active, onClick, label}) => (
    <button
        type="button"
        onClick={onClick}
        className={`h-10 rounded-lg text-sm font-bold transition-all duration-200 border
        ${active 
            ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-900/20' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
        }`}
    >
        {label}
    </button>
);

const Indicator: React.FC<{active: boolean, label: string}> = ({active, label}) => (
  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
      active 
      ? 'bg-slate-800 dark:bg-slate-700 text-white' 
      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
  }`}>
    {label}
  </span>
);
