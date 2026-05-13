import React from 'react';

export function ToolButton({active, onClick, children, title, testId}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-testid={testId}
      className={`w-10 h-10 border flex items-center justify-center transition-colors ${
        active
          ? 'border-amber-500 text-amber-500 bg-amber-500/10'
          : 'border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-amber-500'
      }`}
    >
      {children}
    </button>
  );
}

export function ToolbarButton({onClick, testId, label, icon: Icon, danger}) {
  return (
    <button
      onClick={onClick}
      title={label}
      data-testid={testId}
      className={`px-3 py-2 border border-zinc-800 text-zinc-300 transition-colors text-xs font-mono uppercase tracking-widest ${
        danger
          ? 'hover:border-red-500 hover:text-red-400'
          : 'hover:border-amber-500 hover:text-amber-500'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 inline -mt-1 mr-1"/>}
      {label}
    </button>
  );
}

export function Panel({title, children, ...rest}) {
  return (
    <div className="border-b border-zinc-900 p-4" {...rest}>
      <div className="label-metric mb-3">/ {title}</div>
      {children}
    </div>
  );
}

export function ColorRow({label, value, onChange, testId}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 w-14">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="w-7 h-7 bg-transparent border border-zinc-800"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border border-zinc-800 px-2 py-1 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
      />
    </div>
  );
}

export function SliderRow({label, value, onChange, min, max, testId, onMouseUp}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 w-14">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onMouseUp}
        onTouchEnd={onMouseUp}
        data-testid={testId}
        className="flex-1 accent-amber-500"
      />
      <span className="font-mono text-xs w-10 text-right text-zinc-300">{Math.round(value)}</span>
    </div>
  );
}

export function SliderCenter({value, onChange, min, max, onMouseUp, extraText = ""}) {
  return (
    <div className="flex items-center mb-2 w-full group">
      <div className="flex-[3] flex items-center h-5">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseUp={onMouseUp}
          onTouchEnd={onMouseUp}
          className="w-full h-1.5 accent-amber-500"
        />
      </div>
      <span className="flex-[2] font-mono text-sm text-right text-amber-500 font-medium whitespace-nowrap">
    {Math.round(value)} {extraText}
  </span>
    </div>
  );
}

export function SmallBtn({onClick, children, testId, danger}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center justify-center gap-1 py-1.5 border text-[10px] font-mono uppercase tracking-widest ${
        danger
          ? 'border-zinc-800 text-zinc-300 hover:border-red-500 hover:text-red-400'
          : 'border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-amber-500'
      }`}
    >
      {children}
    </button>
  );
}

export function IconButton({onClick, title, icon: Icon, active, danger, testId, disabled, className = ''}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-testid={testId}
      disabled={disabled}
      className={`p-1.5 border transition-colors ${
        active
          ? 'border-amber-500 text-amber-500 bg-amber-500/10'
          : danger
            ? 'border-zinc-800 text-zinc-400 hover:border-red-500 hover:text-red-400'
            : 'border-zinc-800 text-zinc-400 hover:border-amber-500 hover:text-amber-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <Icon className="w-4 h-4"/>
    </button>
  );
}

export function TabButton({active, onClick, children, testId}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
        active
          ? 'bg-amber-500 text-black'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      {children}
    </button>
  );
}

export function Separator({vertical = false, className = ''}) {
  return (
    <div
      className={`bg-zinc-800 ${vertical ? 'w-px h-6' : 'h-px w-full'} ${className}`}
    />
  );
}

export function ButtonGroup({children, className = ''}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {children}
    </div>
  );
}
