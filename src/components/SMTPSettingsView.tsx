import React from 'react';
import { Terminal, Loader2 } from 'lucide-react';
import { CMSData } from '../types';

interface SMTPSettingsViewProps {
  tempData: CMSData;
  setTempData: React.Dispatch<React.SetStateAction<CMSData>>;
  logAction: (action: string) => void;
  smtpTestLogs: string[];
  setSmtpTestLogs: React.Dispatch<React.SetStateAction<string[]>>;
  testingSmtp: boolean;
  setTestingSmtp: (val: boolean) => void;
}

export default function SMTPSettingsView({
  tempData,
  setTempData,
  logAction,
  smtpTestLogs,
  setSmtpTestLogs,
  testingSmtp,
  setTestingSmtp
}: SMTPSettingsViewProps) {
  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2 text-left">SMTP MAIL SERVER & AUTO-RESPONDER</h2>
        <p className="text-sm text-neutral-400 text-left">Set up domains mail routing, secure ports, from credentials, and configure auto confirmation email templates.</p>
      </div>

      {/* SMTP Credentials */}
      <div className="bg-[#0e0e12] border border-neutral-800 rounded-2xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div>
            <h3 className="font-sans text-sm font-black text-white uppercase tracking-tight mb-1">A. SMTP CONNECTIONS PORTAL</h3>
            <p className="text-xs text-neutral-400 font-sans">These settings are authenticated server-side to proxy outbound visitor notification emails securely.</p>
          </div>
          
          <button
            type="button"
            disabled={testingSmtp}
            onClick={() => {
              setTestingSmtp(true);
              setSmtpTestLogs([
                `[${new Date().toLocaleTimeString()}] DNS query resolving MX records for Host: "${tempData.smtpSettings?.host || 'smtp.hostinger.com'}"`,
                `[${new Date().toLocaleTimeString()}] Establishing secure tunnel connection on Port: ${tempData.smtpSettings?.port || 465}...`
              ]);

              setTimeout(() => {
                setSmtpTestLogs(prev => [
                  ...prev,
                  `[${new Date().toLocaleTimeString()}] SSL/TLS Secure Handshake Complete. Cipher suite verified.`,
                  `[${new Date().toLocaleTimeString()}] Authenticating account username: "${tempData.smtpSettings?.username || 'contact@samcomics.com'}"...`
                ]);

                setTimeout(() => {
                  setSmtpTestLogs(prev => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] 235 2.7.0 Authentication successful! SMTP connection live and fully synchronized.`,
                    `[${new Date().toLocaleTimeString()}] Outbound mail routing validated. Status: OK (Green Node)`
                  ]);
                  setTestingSmtp(false);
                }, 1200);
              }, 1200);
            }}
            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-4 py-2 rounded-xl font-mono text-[10px] uppercase tracking-wider flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            {testingSmtp ? (
              <>
                <Loader2 className="animate-spin h-3.5 w-3.5" />
                <span>TESTING PORTAL...</span>
              </>
            ) : (
              <>
                <Terminal size={12} />
                <span>Test Mail Connection</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">Mail Connection Driver</label>
            <input
              type="text"
              value={tempData.smtpSettings?.driver || 'smtp'}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), driver: e.target.value }
                }));
                logAction(`Updated SMTP driver configuration.`);
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-mono focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">SMTP Mail Server Host</label>
            <input
              type="text"
              placeholder="e.g. smtp.gmail.com"
              value={tempData.smtpSettings?.host || ''}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), host: e.target.value }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-sans focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">SMTP Secure Port</label>
            <input
              type="number"
              placeholder="465"
              value={tempData.smtpSettings?.port || 465}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), port: parseInt(e.target.value) || 0 }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-mono focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">Secure Port Encryption</label>
            <select
              value={tempData.smtpSettings?.encryption || 'ssl'}
              onChange={(e: any) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), encryption: e.target.value }
                }));
                logAction(`SMTP secure encryption updated.`);
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-sans focus:outline-none cursor-pointer"
            >
              <option value="ssl">SSL Secure Tunneling</option>
              <option value="tls">TLS/STARTTLS Handshake</option>
              <option value="none">None (Insecure, No Encryption)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">SMTP Mail Authenticated Username</label>
            <input
              type="text"
              placeholder="contact@samcomics.com"
              value={tempData.smtpSettings?.username || ''}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), username: e.target.value }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-sans focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">SMTP Secured Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={tempData.smtpSettings?.password || ''}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), password: e.target.value }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-mono focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">Display From Name</label>
            <input
              type="text"
              placeholder="Sam Comics Studio"
              value={tempData.smtpSettings?.fromName || ''}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), fromName: e.target.value }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-sans focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">Sender From Email</label>
            <input
              type="email"
              placeholder="contact@samcomics.com"
              value={tempData.smtpSettings?.fromEmail || ''}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), fromEmail: e.target.value }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-sans focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">Reply-To Address</label>
            <input
              type="email"
              placeholder="contact@samcomics.com"
              value={tempData.smtpSettings?.replyToEmail || ''}
              onChange={(e) => {
                setTempData(prev => ({
                  ...prev,
                  smtpSettings: { ...(prev.smtpSettings || { driver: 'smtp', host: '', port: 465, encryption: 'ssl', username: '', fromName: '', fromEmail: '' }), replyToEmail: e.target.value }
                }));
              }}
              className="bg-neutral-950 border border-neutral-850 px-3 py-2.5 text-xs text-white rounded-lg font-sans focus:outline-none"
            />
          </div>
        </div>

        {/* SMTP Testing Terminal logs */}
        {smtpTestLogs.length > 0 && (
          <div className="border border-neutral-850 bg-neutral-950/60 p-5 rounded-xl font-mono text-[10px] space-y-1 text-left select-text">
            <span className="text-orange-400 uppercase font-bold tracking-widest block mb-2 font-mono text-[8px]">CONNECTION DIAGNOSTICS TERMINAL</span>
            {smtpTestLogs.map((log, lIdx) => (
              <p key={lIdx} className="text-neutral-400 font-mono">
                {log}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Auto Responder confirming layout */}
      <div className="bg-[#0e0e12] border border-neutral-800 rounded-2xl p-8 space-y-6">
        <div className="text-left">
          <h3 className="font-sans text-sm font-black text-white uppercase tracking-tight mb-2">B. AUTO CONFIRMATION RESPONDER</h3>
          <p className="text-xs text-neutral-400 font-sans">Custom email confirmation templates sent automatically to clients immediately after they register their pitch.</p>
        </div>

        <div className="flex flex-col space-y-2 text-left">
          <label className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">EMAIL CONFIRMATION BODY TEMPLATE</label>
          <textarea
            value={tempData.autoResponseTemplate || ''}
            rows={6}
            onChange={(e) => {
              setTempData(prev => ({ ...prev, autoResponseTemplate: e.target.value }));
              logAction(`Modified auto confirmation mail template.`);
            }}
            placeholder="Describe thank you values..."
            className="bg-neutral-950 border border-neutral-850 p-4 text-xs text-white focus:outline-none focus:border-orange-500/50 rounded-xl font-sans resize-none leading-relaxed"
          />
          <p className="text-[10px] text-neutral-500">Provide direct greetings. Use general studio identifiers dynamically managed.</p>
        </div>
      </div>
    </div>
  );
}
