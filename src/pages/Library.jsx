import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { designsApi } from '@/lib/api';
import { Plus, Trash2, Pencil, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function Library() {
  // const [designs, setDesigns] = useState([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   designsApi.list().then((d) => { setDesigns(d); setLoading(false); }).catch(() => setLoading(false));
  // }, []);

  // async function remove(id) {
  //   if (!window.confirm('Delete this design?')) return;
  //   try {
  //     await designsApi.remove(id);
  //     setDesigns((d) => d.filter((x) => x.id !== id));
  //     toast.success('Deleted');
  //   } catch (e) { toast.error('Delete failed'); }
  // }

  return (
    <div className="flex-1 bg-[#09090B] px-4 sm:px-6 lg:px-12 py-10" data-testid="library-page">
      <div className="flex items-end justify-between mb-10">
        {/*<div>*/}
        {/*  <div className="label-metric mb-2">/ Library</div>*/}
        {/*  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Saved designs</h1>*/}
        {/*  <p className="text-zinc-400 mt-2">{designs.length} design{designs.length === 1 ? '' : 's'}</p>*/}
        {/*</div>*/}
        <Link to="/editor" data-testid="new-design" className="inline-flex items-center gap-2 px-4 py-3 bg-amber-500 text-black hover:bg-amber-400 text-xs font-mono uppercase tracking-widest">
          <Plus className="w-4 h-4" /> New design
        </Link>
      </div>

      {/*{loading ? (*/}
      {/*  <p className="text-zinc-500 font-mono">Loading…</p>*/}
      {/*) : designs.length === 0 ? (*/}
      {/*  <div className="border border-dashed border-zinc-800 p-12 text-center" data-testid="empty-library">*/}
      {/*    <Layers className="w-10 h-10 text-zinc-700 mx-auto mb-4" strokeWidth={1.5} />*/}
      {/*    <p className="text-zinc-400 mb-4">No designs saved yet.</p>*/}
      {/*    <Link to="/editor" className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black text-xs font-mono uppercase tracking-widest">*/}
      {/*      Create your first design*/}
      {/*    </Link>*/}
      {/*  </div>*/}
      {/*) : (*/}
      {/*  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">*/}
      {/*    {designs.map((d) => (*/}
      {/*      <article key={d.id} className="border border-zinc-800 bg-[#0b0b0d] hover:border-amber-500/50 transition-colors group" data-testid={`design-${d.id}`}>*/}
      {/*        <Link to={`/editor/${d.id}`} className="block">*/}
      {/*          <div className="aspect-square bg-checker border-b border-zinc-800 overflow-hidden">*/}
      {/*            {d.thumbnail ? (*/}
      {/*              <img src={d.thumbnail} alt={d.name} className="w-full h-full object-contain" />*/}
      {/*            ) : (*/}
      {/*              <div className="w-full h-full flex items-center justify-center text-zinc-700 font-mono">No preview</div>*/}
      {/*            )}*/}
      {/*          </div>*/}
      {/*        </Link>*/}
      {/*        <div className="p-4">*/}
      {/*          <div className="flex items-start justify-between gap-3">*/}
      {/*            <div className="min-w-0">*/}
      {/*              <h3 className="font-semibold tracking-tight truncate">{d.name}</h3>*/}
      {/*              <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-widest">*/}
      {/*                {d.colors?.length || 0} COLORS · {(d.canvas_data?.strokes?.length || 0)} STROKES*/}
      {/*              </p>*/}
      {/*            </div>*/}
      {/*            <div className="flex items-center gap-1.5 shrink-0">*/}
      {/*              <Link to={`/editor/${d.id}`} className="p-1.5 border border-zinc-800 hover:border-amber-500 text-zinc-300 hover:text-amber-500" data-testid={`edit-${d.id}`}>*/}
      {/*                <Pencil className="w-3.5 h-3.5" />*/}
      {/*              </Link>*/}
      {/*              <button onClick={() => remove(d.id)} className="p-1.5 border border-zinc-800 hover:border-red-500 text-zinc-300 hover:text-red-400" data-testid={`delete-${d.id}`}>*/}
      {/*                <Trash2 className="w-3.5 h-3.5" />*/}
      {/*              </button>*/}
      {/*            </div>*/}
      {/*          </div>*/}
      {/*          {d.colors && d.colors.length > 0 && (*/}
      {/*            <div className="flex gap-1 mt-3">*/}
      {/*              {d.colors.slice(0, 8).map((c) => (*/}
      {/*                <span key={c} className="w-4 h-4 border border-zinc-700" style={{ background: c }} />*/}
      {/*              ))}*/}
      {/*            </div>*/}
      {/*          )}*/}
      {/*        </div>*/}
      {/*      </article>*/}
      {/*    ))}*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
}
