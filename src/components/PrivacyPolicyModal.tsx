import React, { useState } from 'react';
import {
  Shield,
  X,
  ExternalLink,
  Mail,
  CheckCircle2,
  Lock,
  Eye,
  FileText,
  Copy,
  Check,
  Globe,
  Sparkles,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPolicy = () => {
    const text = `Welcome to Boss Aura AI (accessible from https://boss-aura.ai.studio/). Your privacy is extremely important to us. This Privacy Policy document outlines the types of personal information that is collected and recorded by Boss Aura AI and how we use it.\n\nIf you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at bossliabdullah099@gmail.com.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="privacy-policy-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#18191c] border-gray-800 text-gray-100 shadow-blue-950/40'
            : 'bg-white border-gray-200 text-gray-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
            isDarkMode
              ? 'border-gray-800/80 bg-gradient-to-r from-blue-950/30 to-purple-950/20'
              : 'border-gray-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Privacy Policy</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Official
                </span>
              </div>
              <p className="text-xs opacity-70 flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3 text-blue-400" />
                <span>boss-aura.ai.studio</span>
              </p>
            </div>
          </div>

          <button
            id="close-privacy-modal-btn"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-black'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed custom-scrollbar">
          {/* Official Core Statement Box (Exact requested text) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isDarkMode
                ? 'bg-blue-950/25 border-blue-500/30 text-blue-100'
                : 'bg-blue-50/90 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-xs sm:text-sm">
                  Welcome to <strong>Boss Aura AI</strong> (accessible from{' '}
                  <a
                    href="https://boss-aura.ai.studio/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                  >
                    https://boss-aura.ai.studio/
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  ). Your privacy is extremely important to us. This Privacy Policy document outlines
                  the types of personal information that is collected and recorded by Boss Aura AI and
                  how we use it.
                </p>
                <p className="font-medium text-xs sm:text-sm">
                  If you have additional questions or require more information about our Privacy
                  Policy, do not hesitate to contact us.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Consent */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-blue-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Consent & Agreement
            </h3>
            <p className="opacity-80">
              By utilizing our AI services, chatting with Boss Aura AI, participating in daily
              check-ins, or using the Coding Studio at{' '}
              <span className="font-mono text-xs">https://boss-aura.ai.studio/</span>, you hereby
              consent to our Privacy Policy and agree to all terms outlined herein.
            </p>
          </div>

          {/* Section 2: Information We Collect */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-blue-400">
              <FileText className="w-4 h-4 text-blue-400" />
              2. Information Collected & Recorded
            </h3>
            <p className="opacity-80">
              The personal information that you are asked to provide, and the reasons why you are
              asked to provide it, will be made clear to you at the point we ask:
            </p>
            <ul className="list-disc list-inside space-y-1.5 opacity-80 pl-2">
              <li>
                <strong>Account Credentials:</strong> If you sign in via Google OAuth or create an
                account, we store your display name and email address to maintain your personal
                session. If you choose <strong>Guest Mode</strong>, no personal credentials are
                recorded.
              </li>
              <li>
                <strong>Prompts & Interactions:</strong> Questions, code queries, image requests, and
                conversations submitted to Boss Aura AI to generate responses, code snippets, and
                insights.
              </li>
              <li>
                <strong>Daily Credit & Check-In Data:</strong> Records of your daily 5-credit check-in
                and mission rewards to verify authentic daily active usage.
              </li>
            </ul>
          </div>

          {/* Section 3: How We Use Your Information */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-blue-400">
              <Eye className="w-4 h-4 text-indigo-400" />
              3. How We Use Your Information
            </h3>
            <p className="opacity-80">We use the information we collect in various ways, including to:</p>
            <ul className="list-disc list-inside space-y-1.5 opacity-80 pl-2">
              <li>Provide, operate, and maintain Boss Aura AI's interactive chat & coding engine.</li>
              <li>Improve, personalize, and expand our responsive intelligence capabilities.</li>
              <li>Understand and analyze how visitors interact with our coding studio and features.</li>
              <li>Award daily checking credits (5 credits/day) and prevent abuse or unauthorized access.</li>
              <li>Provide customer assistance and notify you of feature enhancements.</li>
            </ul>
          </div>

          {/* Section 4: Data Security & Storage */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-blue-400">
              <Lock className="w-4 h-4 text-emerald-400" />
              4. Data Protection & Security
            </h3>
            <p className="opacity-80">
              We employ industry-standard encryption protocols (HTTPS/TLS) and secure tokenization to
              safeguard your personal data. We do not sell, rent, or trade your personal contact
              details to third parties.
            </p>
          </div>

          {/* Section 5: Contact Us */}
          <div
            className={`p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#212328] border-gray-800' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h3 className="font-bold text-sm flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4 text-blue-400" />
              Questions or Concerns? Contact Us
            </h3>
            <p className="opacity-75 text-xs mb-3">
              If you have any questions, require additional details, or wish to manage your data,
              please reach out directly:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="mailto:bossliabdullah099@gmail.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>bossliabdullah099@gmail.com</span>
              </a>
              <button
                type="button"
                onClick={handleCopyPolicy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium text-xs transition-colors ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Statement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between shrink-0 gap-3 ${
            isDarkMode ? 'border-gray-800/80 bg-[#161719]' : 'border-gray-100 bg-gray-50'
          }`}
        >
          <div className="text-[11px] opacity-60 hidden sm:block">
            Last Updated: 2026 · Boss Aura AI Security
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="privacy-close-btn"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              I Understand & Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
