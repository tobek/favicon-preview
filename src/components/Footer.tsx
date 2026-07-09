interface FooterProps {
  isDarkMode: boolean;
  onNavigate: (path: string) => void;
  onArchivePage?: boolean;
}

export function Footer({ isDarkMode, onNavigate, onArchivePage }: FooterProps) {
  const linkClass = isDarkMode ? 'text-gray-400' : 'text-slate-500';
  const textClass = isDarkMode ? 'text-gray-500' : 'text-slate-400';
  const crossLinkPath = onArchivePage ? '/' : '/archive';
  const crossLinkLabel = onArchivePage ? 'favicon preview tool' : 'favicon archive';

  return (
    <footer className={`text-center mt-8 md:mt-16 space-y-1 text-sm transition-colors ${textClass}`}>
      <p>
        Made by{' '}
        <a
          href="https://tobyfox.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:underline ${linkClass}`}
        >
          Toby Fox
        </a>
      </p>
      <p>
        Feedback?{' '}
        <a
          href="https://github.com/tobek/favicon-preview"
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:underline ${linkClass}`}
        >
          Open an issue on GitHub
        </a>
      </p>
      <p>
        Check out the{' '}
        <a
          href={crossLinkPath}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(crossLinkPath);
          }}
          className={`hover:underline ${linkClass}`}
        >
          {crossLinkLabel}
        </a>
      </p>
    </footer>
  );
}
