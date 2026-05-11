import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Selector from '@/pages/Selector';
import Editor from '@/pages/Editor';
import Projection from '@/pages/Projection';
import Library from '@/pages/Library';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/selector" replace />} />
            <Route path="/selector" element={<Selector />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor/:designId" element={<Editor />} />
            <Route path="/projection" element={<Projection />} />
            <Route path="/library" element={<Library />} />
          </Routes>
        </Layout>
        <Toaster theme="dark" />
      </BrowserRouter>
    </div>
  );
}

export default App;
