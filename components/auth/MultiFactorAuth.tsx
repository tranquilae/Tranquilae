'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import {
  Shield,
  Smartphone,
  Key,
  QrCode,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Info,
  Settings,
  Clock,
  Download,
} from 'lucide-react';

interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes';
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  lastUsed?: string;
  description: string;
}

interface BackupCode {
  code: string;
  used: boolean;
}

export function MultiFactorAuth() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([
    {
      id: 'totp',
      type: 'totp',
      name: 'Authenticator App',
      icon: <Smartphone className="w-5 h-5" />,
      enabled: false,
      description: 'Use Google Authenticator, Authy, or similar apps',
    },
    {
      id: 'sms',
      type: 'sms',
      name: 'SMS Text Message',
      icon: <Mail className="w-5 h-5" />,
      enabled: false,
      description: 'Receive codes via text message',
    },
    {
      id: 'email',
      type: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      enabled: false,
      description: 'Receive codes via email',
    },
    {
      id: 'backup_codes',
      type: 'backup_codes',
      name: 'Backup Codes',
      icon: <Key className="w-5 h-5" />,
      enabled: false,
      description: 'Single-use recovery codes',
    },
  ]);

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status');
      const result = await response.json();
      
      if (result.success) {
        setMfaMethods(prev => prev.map(method => ({
          ...method,
          enabled: result.data.enabledMethods.includes(method.type),
          lastUsed: result.data.lastUsed[method.type],
        })));
      }
    } catch (error) {
      console.error('Failed to load MFA status:', error);
    }
  };

  const initiateSetup = async (methodType: string) => {
    setSelectedMethod(methodType);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: methodType }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (methodType === 'totp') {
          setQrCode(result.data.qrCode);
          setSecret(result.data.secret);
        }
        setStep('verify');
      }
    } catch (error) {
      console.error('Failed to initiate MFA setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: selectedMethod,
          code: verificationCode,
          secret: secret,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.data.backupCodes) {
          setBackupCodes(result.data.backupCodes.map((code: string) => ({
            code,
            used: false,
          })));
        }
        setStep('complete');
        loadMFAStatus();
      }
    } catch (error) {
      console.error('Failed to verify MFA setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const disableMethod = async (methodType: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: methodType }),
      });
      
      if (response.ok) {
        loadMFAStatus();
      }
    } catch (error) {
      console.error('Failed to disable MFA method:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/mfa/backup-codes/regenerate', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBackupCodes(result.data.codes.map((code: string) => ({
          code,
          used: false,
        })));
        setShowBackupCodes(true);
      }
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success notification
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.map(({ code }) => code).join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tranquilae-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (step === 'setup') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Two-Factor Authentication
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Why enable 2FA?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Two-factor authentication significantly increases your account security by requiring 
                  a second form of verification when logging in, even if someone has your password.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MFA Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mfaMethods.map((method) => (
            <div key={method.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    method.enabled 
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {method.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {method.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {method.description}
                    </p>
                  </div>
                </div>
                
                {method.enabled ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                  </div>
                ) : null}
              </div>

              {method.enabled && method.lastUsed && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  Last used: {new Date(method.lastUsed).toLocaleDateString()}
                </div>
              )}

              <div className="flex items-center gap-3">
                {method.enabled ? (
                  <>
                    <button
                      onClick={() => disableMethod(method.type)}
                      disabled={loading}
                      className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50"
                    >
                      Disable
                    </button>
                    {method.type === 'backup_codes' && (
                      <button
                        onClick={generateNewBackupCodes}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => initiateSetup(method.type)}
                    disabled={loading}
                    className="accent-button px-4 py-2 disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 mx-auto mb-4">
              <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Verify Your Setup
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Complete the setup by verifying your {mfaMethods.find(m => m.id === selectedMethod)?.name}
            </p>
          </div>

          {selectedMethod === 'totp' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  1. Scan QR Code with your authenticator app
                </h3>
                <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                  <Image src={qrCode} alt="QR Code" width={192} height={192} className="w-48 h-48" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  2. Or enter this secret key manually:
                </h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <code className="flex-1 font-mono text-sm">
                    {showSecret ? secret : '••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mt-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedMethod === 'totp' ? '3. Enter the 6-digit code from your app:' : 'Enter verification code:'}
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setStep('setup')}
                className="glass-button px-6 py-3"
              >
                Back
              </button>
              <button
                onClick={verifySetup}
                disabled={loading || verificationCode.length !== 6}
                className="accent-button px-6 py-3 flex-1 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              2FA Successfully Enabled!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is now protected with two-factor authentication
            </p>
          </div>

          {backupCodes.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                      Important: Save Your Backup Codes
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      These backup codes can be used to access your account if you lose your authenticator device. 
                      Store them safely and treat them like passwords.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Your Backup Codes
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                      className="glass-button px-3 py-1 text-sm"
                    >
                      {showBackupCodes ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {showBackupCodes ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={downloadBackupCodes}
                      className="glass-button px-3 py-1 text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>

                {showBackupCodes && (
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border font-mono text-sm">
                    {backupCodes.map(({ code }, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                      >
                        <span>{code}</span>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="text-gray-500 hover:text-gray-700 ml-2"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => {
                setStep('setup');
                setSelectedMethod('');
                setVerificationCode('');
                setBackupCodes([]);
                setShowBackupCodes(false);
              }}
              className="accent-button px-6 py-3 flex-1"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
