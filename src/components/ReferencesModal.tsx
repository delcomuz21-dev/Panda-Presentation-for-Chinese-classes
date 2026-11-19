import { ExternalLink, X } from 'lucide-react';
import { REFERENCE_SOURCES } from '../data/curriculum';
import type { LanguageMode } from '../types/panda';

interface ReferencesModalProps {
  open: boolean;
  onClose: () => void;
  language: LanguageMode;
}

export function ReferencesModal({ open, onClose, language }: ReferencesModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scientific Sources and References"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="museum-surface-dark flex max-h-[85vh] w-full max-w-2xl flex-col text-[#F2EFE6]">
        <div className="flex items-center justify-between border-b border-[#F2EFE6]/12 px-6 py-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#C9A66B]">
              {language === 'zh' ? '权威参考文献与数据来源' : 'Verified Scientific & Institutional Sources'}
            </p>
            <h2 className="font-editorial mt-0.5 text-2xl font-semibold">
              {language === 'zh' ? '研究文献与保护数据索引' : 'Conservation & Biological References'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close References"
            className="inline-flex h-9 w-9 items-center justify-center border border-[#F2EFE6]/15 text-[#F2EFE6]/80 hover:border-[#C9A66B] hover:text-[#C9A66B]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="museum-scrollbar flex-1 space-y-3 overflow-y-auto p-6">
          {REFERENCE_SOURCES.map((ref) => (
            <article key={ref.id} className="border border-[#F2EFE6]/12 bg-[#10251B]/65 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#C9A66B]">
                    {ref.organization} · {ref.year}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#F2EFE6]">{ref.title}</h3>
                </div>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 border border-[#C9A66B]/40 px-2.5 py-1 text-xs text-[#C9A66B] hover:bg-[#C9A66B] hover:text-[#10251B]"
                >
                  <span>Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#F2EFE6]/75">{ref.note}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
