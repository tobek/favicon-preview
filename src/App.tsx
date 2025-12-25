import { useState } from 'react';
import {
  ChromeDarkTab,
  ChromeLightTab,
  ChromeColorTab,
  SafariTahoeDarkTab,
  SafariTahoeLightTab
} from './components/tabs/index.ts';

// Example favicons - using public URLs for now
const EXAMPLE_FAVICONS = [
  { icon: '/favicon-examples/favicon.ico', title: 'Example Site 1' },
  { icon: '/favicon-examples/favicon.ico.1', title: 'Example Site 2' },
  { icon: '/favicon-examples/wikipedia.ico', title: 'Wikipedia' },
];

// Dummy favicons for context
const DUMMY_TABS = [
  { icon: 'https://www.google.com/favicon.ico', title: 'Google' },
  { icon: 'https://github.com/favicon.ico', title: 'GitHub' },
  { icon: 'https://www.youtube.com/favicon.ico', title: 'YouTube' },
];

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">
            Favicon Preview
          </h1>
          <p className="text-slate-600 text-lg">
            See how your favicons look in browser tabs across different contexts
          </p>

          {/* Collapse Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCollapsed}
                onChange={(e) => setIsCollapsed(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-slate-700">
                Collapsed tabs
              </span>
            </label>
          </div>
        </div>

        {/* Chrome Dark */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Chrome - Dark Mode
          </h2>
          <div className="bg-[#202124] rounded-lg overflow-hidden">
            <div className="flex items-end gap-[2px] px-2 pt-2 bg-[#202124]">
              {DUMMY_TABS.map((tab, i) => (
                <ChromeDarkTab
                  key={i}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={i === 1}
                  isCollapsed={isCollapsed}
                />
              ))}
              {EXAMPLE_FAVICONS.map((tab, i) => (
                <ChromeDarkTab
                  key={`example-${i}`}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={false}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
            <div className="h-3 bg-[#35363a]"></div>
          </div>
        </div>

        {/* Chrome Light */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Chrome - Light Mode
          </h2>
          <div className="bg-[#dee1e6] rounded-lg overflow-hidden">
            <div className="flex items-end gap-[2px] px-2 pt-2 bg-[#dee1e6]">
              {DUMMY_TABS.map((tab, i) => (
                <ChromeLightTab
                  key={i}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={i === 1}
                  isCollapsed={isCollapsed}
                />
              ))}
              {EXAMPLE_FAVICONS.map((tab, i) => (
                <ChromeLightTab
                  key={`example-${i}`}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={false}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
            <div className="h-3 bg-white"></div>
          </div>
        </div>

        {/* Chrome Color */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Chrome - Color Theme
          </h2>
          <div className="bg-[#2d4a46] rounded-lg overflow-hidden">
            <div className="flex items-end gap-[2px] px-2 pt-2 bg-[#2d4a46]">
              {DUMMY_TABS.map((tab, i) => (
                <ChromeColorTab
                  key={i}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={i === 1}
                  isCollapsed={isCollapsed}
                  bgColor="#3d5f5a"
                />
              ))}
              {EXAMPLE_FAVICONS.map((tab, i) => (
                <ChromeColorTab
                  key={`example-${i}`}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={false}
                  isCollapsed={isCollapsed}
                  bgColor="#3d5f5a"
                />
              ))}
            </div>
            <div className="h-3 bg-[#3d5f5a]"></div>
          </div>
        </div>

        {/* Safari Tahoe Dark */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Safari Tahoe - Dark Mode
          </h2>
          <div className="bg-[#1c1c1e] p-3 rounded-lg">
            <div className="flex items-center gap-1.5">
              {DUMMY_TABS.map((tab, i) => (
                <SafariTahoeDarkTab
                  key={i}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={i === 1}
                  isCollapsed={isCollapsed}
                />
              ))}
              {EXAMPLE_FAVICONS.map((tab, i) => (
                <SafariTahoeDarkTab
                  key={`example-${i}`}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={false}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Safari Tahoe Light */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Safari Tahoe - Light Mode
          </h2>
          <div className="bg-[#e8e8ed] p-3 rounded-lg">
            <div className="flex items-center gap-1.5">
              {DUMMY_TABS.map((tab, i) => (
                <SafariTahoeLightTab
                  key={i}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={i === 1}
                  isCollapsed={isCollapsed}
                />
              ))}
              {EXAMPLE_FAVICONS.map((tab, i) => (
                <SafariTahoeLightTab
                  key={`example-${i}`}
                  favicon={tab.icon}
                  title={tab.title}
                  isActive={false}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
