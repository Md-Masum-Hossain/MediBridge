import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import AlarmBottomSheet from '@/components/alarm/AlarmBottomSheet';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-light selection:text-brand">
      <ServiceWorkerRegister />
      <Header />
      {/* Mobile: pb-24 for bottom nav clearance. Desktop: pb-8, no bottom nav */}
      <div className="flex-1 pb-24 md:pb-8 w-full">
        {children}
      </div>
      <BottomNav />
      <AlarmBottomSheet />

      {/* ── Clinical Editorial Footer ── desktop only ── */}
      <footer className="hidden md:block border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: wordmark + disclaimer */}
          <p className="text-[11px] text-[#4B5563] leading-snug">
            <span className="font-semibold text-[#0B4F4A] tracking-tight mr-1.5">MediBridge</span>
            AI-assisted digitization — verify dosages with a licensed pharmacist.
          </p>

          {/* Right: copyright + links */}
          <p className="text-[11px] text-[#4B5563] flex items-center gap-1.5 shrink-0">
            <span>© 2026</span>
            <a
              href="https://www.masumsportfolio.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#4B5563] hover:text-[#0B4F4A] hover:underline underline-offset-2 decoration-[#0B4F4A] transition-colors"
            >
              Md. Masum Hossain
            </a>
            <span className="text-[#9CA3AF]">·</span>
            <a
              href="mailto:mdmasumhossain1712@gmail.com"
              className="text-[#4B5563] hover:text-[#0B4F4A] hover:underline underline-offset-2 decoration-[#0B4F4A] transition-colors"
            >
              Email
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
