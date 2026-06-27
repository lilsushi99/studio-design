import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCMSData, saveCMSDataToServer, resetCMSDataOnServer, fetchCMSDataFromServer } from './data';
import { CMSData, PortfolioProject, BlogArticle } from './types';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PortfolioPage from './pages/PortfolioPage';
import StudioPage from './pages/StudioPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import Footer from './components/Footer';
import ProjectDetailModal from './components/ProjectDetailModal';
import AdminPanel from './components/AdminPanel';
import CustomCursor from './components/CustomCursor';

export default function App() {
  const [cmsData, setCmsData] = useState<CMSData>(getCMSData());
  const [currentPage, setCurrentPage] = useState<CMSData['navigation']['links'][0]['page']>('home');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname === '/goat02');

  // Expose global tracker helper for buttons and page views
  useEffect(() => {
    (window as any).trackAnalyticsEvent = (event: {
      type: 'visit' | 'pageview' | 'button_click' | 'lead';
      page?: string;
      buttonId?: string;
      leadType?: string;
      projectId?: string;
    }) => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.analytics) {
            // Keep local state in sync if we want immediate updates
            setCmsData(prev => ({
              ...prev,
              analytics: data.analytics
            }));
          }
        })
        .catch(err => console.warn('Tracker failed', err));
    };
  }, []);

  // Automatically track page views on navigation
  useEffect(() => {
    if (window.location.pathname !== '/goat02') {
      if ((window as any).trackAnalyticsEvent) {
        (window as any).trackAnalyticsEvent({ type: 'pageview', page: currentPage });
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'pageview', page: currentPage })
        }).catch(err => console.warn('Tracker failed', err));
      }
    }
  }, [currentPage]);

  // Synchronize state when custom event triggers or fetch on load
  useEffect(() => {
    const handleCmsUpdate = () => {
      setCmsData(getCMSData());
    };
    window.addEventListener('cms_data_updated', handleCmsUpdate);

    // Initial server fetch to load actual production database
    const syncWithServer = async () => {
      const serverData = await fetchCMSDataFromServer();
      setCmsData(serverData);
      if (window.location.pathname !== '/goat02') {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'visit' })
        }).catch(err => console.warn('Failed to register visit tracker', err));
      }
    };
    syncWithServer();

    // Enforce robots.txt noindex metadata dynamically
    if (window.location.pathname === '/goat02') {
      let meta = document.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex, nofollow');
    }

    return () => window.removeEventListener('cms_data_updated', handleCmsUpdate);
  }, []);

  // Dynamically update title and favicon in the browser tab
  useEffect(() => {
    const titleVal = cmsData.globalSettings?.browserTitle || cmsData.navigation?.logoText || 'STUDIO KAIJU';
    document.title = titleVal;

    const faviconUrl = cmsData.globalSettings?.faviconUrl || cmsData.navigation?.favicon;
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [cmsData.globalSettings?.browserTitle, cmsData.globalSettings?.faviconUrl, cmsData.navigation?.favicon, cmsData.navigation?.logoText]);

  const handleSaveCMS = async (newData: CMSData) => {
    setCmsData(newData);
    await saveCMSDataToServer(newData);
  };

  const handleResetCMS = async () => {
    const defaultData = await resetCMSDataOnServer();
    setCmsData(defaultData);
  };

  const handleNavigate = (page: typeof currentPage) => {
    setCurrentPage(page);
    // Clear sub-page detail selectors when moving around
    setSelectedArticle(null);
    setSelectedProject(null);
  };

  const handleSelectProject = (project: PortfolioProject) => {
    setSelectedProject(project);
    if ((window as any).trackAnalyticsEvent) {
      (window as any).trackAnalyticsEvent({ type: 'pageview', page: 'portfolio', projectId: project.id });
    }
  };

  const handleSelectArticle = (article: BlogArticle | null) => {
    setSelectedArticle(article);
    if (article) {
      setCurrentPage('blog');
    }
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            data={cmsData}
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
            onSelectArticle={handleSelectArticle}
          />
        );
      case 'portfolio':
        return (
          <PortfolioPage
            data={cmsData}
            onSelectProject={handleSelectProject}
          />
        );
      case 'studio':
        return <StudioPage data={cmsData} onNavigate={handleNavigate} />;
      case 'blog':
        return (
          <BlogPage
            data={cmsData}
            selectedArticle={selectedArticle}
            onSelectArticle={setSelectedArticle}
          />
        );
      case 'contact':
        return <ContactPage data={cmsData} />;
      default:
        return (
          <Home
            data={cmsData}
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
            onSelectArticle={handleSelectArticle}
          />
        );
    }
  };

  // If visiting the secret /goat02 route, render the powerful Neubrutalist Fullscreen Admin Panel
  if (isAdminRoute) {
    return (
      <div id="admin-viewport" className="bg-neutral-950 text-white min-h-screen">
        <AdminPanel
          data={cmsData}
          isOpen={true}
          onClose={() => {
            // Re-route back to home page if they exit
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
          }}
          onSave={handleSaveCMS}
          onReset={handleResetCMS}
        />
      </div>
    );
  }

  const activeTheme = cmsData.hero?.activeTheme || 'theme-2';
  const getThemeClass = () => {
    switch (activeTheme) {
      case 'theme-1': return 'theme-4k-gradient bg-neutral-950 text-white';
      case 'theme-2': return 'theme-starfield-a bg-black text-white';
      case 'theme-3': return 'theme-starfield-b bg-black text-white';
      case 'theme-4': return 'theme-deep-black bg-black text-white';
      case 'theme-5': return 'theme-neubrutalism bg-[#fdf9ed] text-black';
      case 'theme-6': return 'theme-saas bg-[#f6f8fa] text-neutral-900';
      default:
        return 'theme-starfield-a bg-black text-white';
    }
  };

  const isStarfieldCursor = activeTheme === 'theme-2' || activeTheme === 'theme-3';

  return (
    <div
      id="applet-viewport"
      className={`${getThemeClass()} min-h-screen relative flex flex-col font-sans antialiased selection:bg-white selection:text-black ${
        isStarfieldCursor ? 'cursor-none' : ''
      }`}
    >
      {isStarfieldCursor && <CustomCursor />}
      
      {/* Sticky Top Navbar */}
      <Navbar
        config={cmsData.navigation}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenCMS={() => {}}
      />

      {/* Main Page Rendering Workspace with Smooth motion transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + (selectedArticle ? `-${selectedArticle.id}` : '')}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="flex-1"
        >
          {renderActivePage()}
        </motion.div>
      </AnimatePresence>

      {/* Persistent Global Footer Coordinates */}
      <Footer
        config={cmsData.footer}
        links={cmsData.navigation.links}
        onNavigate={handleNavigate}
      />

      {/* Modal: View Visual Portfolio Details */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
