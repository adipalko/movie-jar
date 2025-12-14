import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ContentType = 'movie' | 'tv';

interface ContentTypeContextType {
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
}

const ContentTypeContext = createContext<ContentTypeContextType | undefined>(undefined);

export function ContentTypeProvider({ children }: { children: ReactNode }) {
  // Load from localStorage, default to 'movie'
  const [contentType, setContentTypeState] = useState<ContentType>(() => {
    const saved = localStorage.getItem('contentType');
    return (saved === 'tv' ? 'tv' : 'movie') as ContentType;
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('contentType', contentType);
  }, [contentType]);

  const setContentType = (type: ContentType) => {
    setContentTypeState(type);
  };

  return (
    <ContentTypeContext.Provider
      value={{
        contentType,
        setContentType,
      }}
    >
      {children}
    </ContentTypeContext.Provider>
  );
}

export function useContentType() {
  const context = useContext(ContentTypeContext);
  if (context === undefined) {
    throw new Error('useContentType must be used within a ContentTypeProvider');
  }
  return context;
}

