import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Selector from '@/pages/Selector';
import Editor from '@/pages/Editor';
import Projection from '@/pages/Projection';
import Library from '@/pages/Library';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/lib/i18n';
import SvgEditor from "@/pages/SvgEditor";

function App() {
  return (
    <div className="App">
      <I18nProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/svg" replace />} />
            <Route path="/selector" element={<Selector />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor/:designId" element={<Editor />} />
            <Route path="/projection" element={<Projection />} />
            <Route path="/library" element={<Library />} />
            <Route path="/svg" element={<SvgEditor />} />
          </Routes>
        </Layout>
        <Toaster theme="dark" />
      </BrowserRouter>
      </I18nProvider>
    </div>
  );
}

export default App;
