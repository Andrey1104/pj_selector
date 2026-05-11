import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {motion, AnimatePresence} from 'framer-motion';
import {ArrowRight, Info, RotateCcw, ChevronUp, ChevronDown, Filter, Share2, Loader2, Zap, Award, DollarSign, X} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {Popover, PopoverContent, PopoverTrigger,} from '@/components/ui/popover';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from '@/components/ui/tooltip';
import {calculateProjectors} from '@/lib/projector';
import {cn} from '@/lib/utils';
import {SliderCenter} from "@/components/editor/EditorUI";

const COLORS = [
  {id: 'red', label: 'Red', className: 'bg-red-500', hex: '#ef4444'},
  {id: 'blue', label: 'Blue', className: 'bg-blue-500', hex: '#3b82f6'},
  {id: 'white', label: 'White', className: 'bg-white border border-zinc-400', hex: '#ffffff'},
  {id: 'yellow', label: 'Yellow', className: 'bg-yellow-400', hex: '#facc15'},
];

const SYMBOL_TYPES = [
  {id: 'zebra', label: 'Zebra', image: '/selector-assets/zebra.png'},
  {id: 'round', label: 'Round', image: '/selector-assets/round.png'},
  {id: 'triangle', label: 'Triangle', image: '/selector-assets/triangle.png'},
  {id: 'lift', label: 'Lift', image: '/selector-assets/crane.png'},
];

const VALIDATION_LIMITS = {
  spotIlluminance: {min: 50, max: 5000, label: 'Spot Illuminance'},
  height: {min: 1000, max: 20000, label: 'Working Height'},
};

const initialFormState = {
  spotIlluminance: '300',
  height: '5000',
  color: '',
  inputType: '',
  zebraLength: '',
  zebraWidth: '',
  addGap: false,
  gap: '',
  realSize: '',
  customGlassRound: false,
  glassSizeRound: '',
  triangleSide: '',
  customGlassTriangle: false,
  glassSizeTriangle: '',
  liftLength: '',
  liftWidth: '',
  liftHeight: '',
  liftCapacity: '',
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const containerVariants = {
  hidden: {opacity: 0},
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: {opacity: 0, y: 20},
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const parameterVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0
  },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: 12,
    transition: {
      height: {duration: 0.3},
      opacity: {duration: 0.2, delay: 0.1}
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      height: {duration: 0.2},
      opacity: {duration: 0.1}
    }
  }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.3
    }
  }
};

export default function Selector() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState(() => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      ...initialFormState,
      ...params,
      addGap: params.addGap === 'true',
      customGlassRound: params.customGlassRound === 'true',
      customGlassTriangle: params.customGlassTriangle === 'true',
    };
  });
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [sortConfig, setSortConfig] = useState({key: 'symbolLux', direction: 'desc'});
  const [isCalculating, setIsCalculating] = useState(false);
  const [filters, setFilters] = useState({
    minBrightness: 0,
    maxPrice: 5000,
    projectorType: 'all',
    hideRed: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const debouncedFormData = useDebounce(formData, 400);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== false && value !== initialFormState[key]) {
        params.set(key, String(value));
      }
    });
    setSearchParams(params, {replace: true});
  }, [formData, setSearchParams]);

  const validateField = useCallback((field, value) => {
    const limits = VALIDATION_LIMITS[field];
    if (!limits) return {error: null, warning: null};

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return {error: `Please enter valid ${limits.label.toLowerCase()}`, warning: null};
    }
    if (numValue < limits.min) {
      return {error: null, warning: `${limits.label} is below recommended minimum (${limits.min})`};
    }
    if (numValue > limits.max) {
      return {error: null, warning: `${limits.label} exceeds recommended maximum (${limits.max})`};
    }
    return {error: null, warning: null};
  }, []);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({...prev, [field]: value}));

    const {error, warning} = validateField(field, value);
    setErrors(prev => ({...prev, [field]: error}));
    setWarnings(prev => ({...prev, [field]: warning}));
  }, [validateField]);

  const isFormValid = useMemo(() => {
    if (!formData.spotIlluminance || parseFloat(formData.spotIlluminance) <= 0) return false;
    if (!formData.height || parseFloat(formData.height) <= 0) return false;
    if (!formData.color) return false;
    if (!formData.inputType) return false;

    if (formData.inputType === 'zebra') {
      if (!formData.zebraLength || parseFloat(formData.zebraLength) <= 0) return false;
      if (!formData.zebraWidth || parseFloat(formData.zebraWidth) <= 0) return false;
      if (formData.addGap && (!formData.gap || parseFloat(formData.gap) <= 0)) return false;
    }

    if (formData.inputType === 'round') {
      if (!formData.customGlassRound && (!formData.realSize || parseFloat(formData.realSize) <= 0)) return false;
      if (formData.customGlassRound && (!formData.glassSizeRound || parseFloat(formData.glassSizeRound) <= 0)) return false;
    }

    if (formData.inputType === 'triangle') {
      if (!formData.customGlassTriangle && (!formData.triangleSide || parseFloat(formData.triangleSide) <= 0)) return false;
      if (formData.customGlassTriangle && (!formData.glassSizeTriangle || parseFloat(formData.glassSizeTriangle) <= 0)) return false;
    }

    if (formData.inputType === 'lift') {
      if (!formData.liftLength || parseFloat(formData.liftLength) <= 0) return false;
      if (!formData.liftWidth || parseFloat(formData.liftWidth) <= 0) return false;
      if (!formData.liftHeight || parseFloat(formData.liftHeight) <= 0) return false;
      if (!formData.liftCapacity || parseFloat(formData.liftCapacity) <= 0) return false;
    }

    return true;
  }, [formData]);

  useEffect(() => {
    if (!isFormValid) {
      setResults([]);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(() => {
      try {
        const calculatedResults = calculateProjectors({
          ...debouncedFormData,
          spotIlluminance: parseFloat(debouncedFormData.spotIlluminance),
          height: parseFloat(debouncedFormData.height),
        });
        setResults(calculatedResults);
      } catch (err) {
        console.error('Calculation error:', err);
        setResults([]);
      } finally {
        setIsCalculating(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [debouncedFormData, isFormValid]);

  const handleReset = useCallback(() => {
    setFormData(initialFormState);
    setResults([]);
    setErrors({});
    setWarnings({});
    setSearchParams({}, {replace: true});
  }, [setSearchParams]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(result => {
      if (filters.hideRed && result.resultColor === 'red') return false;
      if (result.symbolLux < filters.minBrightness) return false;
      if (result.price > filters.maxPrice) return false;
      if (filters.projectorType !== 'all') {
        if (filters.projectorType === '25' && !result.projector.startsWith('25')) return false;
        if (filters.projectorType === '100' && !result.projector.startsWith('100')) return false;
        if (filters.projectorType === '300' && !result.projector.startsWith('300')) return false;
      }
      return true;
    });
    if (filtered.length > 0) {
      const maxBrightness = Math.max(...filtered.map(r => r.symbolLux));
      const minPrice = Math.min(...filtered.map(r => r.price));

      filtered = filtered.map(result => ({
        ...result,
        badges: {
          brightest: result.symbolLux === maxBrightness,
          cheapest: result.price === minPrice,
          optimal: result.resultColor !== 'red' && result.symbolSize.startsWith('1 '),
        }
      }));
    }

    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal);
      bVal = String(bVal);
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [results, filters, sortConfig]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minBrightness > 0) count++;
    if (filters.maxPrice < 5000) count++;
    if (filters.projectorType !== 'all') count++;
    if (filters.hideRed) count++;
    return count;
  }, [filters]);

  const SortIcon = ({columnKey}) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1"/>
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1"/>
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 lg:p-6 bg-grid min-h-0">
      <Card className="lg:w-[400px] flex-shrink-0 border-zinc-800 bg-zinc-900/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono tracking-tight text-amber-500">
              PROJECTOR SELECTION
            </CardTitle>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      className="h-8 w-8 border-zinc-700 hover:bg-zinc-800"
                    >
                      <Share2 className="w-4 h-4"/>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share configuration</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                      className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 text-red-400 hover:text-red-300"
                    >
                      <RotateCcw className="w-4 h-4"/>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset form</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 overflow-y-auto max-h-[calc(100vh-260px)]">
          <div className="space-y-2">
            <Label htmlFor="spot-illuminance" className="text-sm text-zinc-300">
              Spot Illuminance (lx)
            </Label>
            <Input
              id="spot-illuminance"
              type="number"
              min={VALIDATION_LIMITS.spotIlluminance.min}
              max={VALIDATION_LIMITS.spotIlluminance.max}
              value={formData.spotIlluminance}
              onChange={(e) => updateField('spotIlluminance', e.target.value)}
              className={cn(
                "bg-zinc-800 border-zinc-700 focus:border-amber-500 transition-colors",
                errors.spotIlluminance && "border-red-500 animate-shake",
                warnings.spotIlluminance && "border-yellow-500"
              )}
            />
            {errors.spotIlluminance && (
              <motion.p
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="text-xs text-red-400"
              >
                {errors.spotIlluminance}
              </motion.p>
            )}
            {warnings.spotIlluminance && !errors.spotIlluminance && (
              <motion.p
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="text-xs text-yellow-400"
              >
                {warnings.spotIlluminance}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="working-height" className="text-sm text-zinc-300">
              Working Height (mm)
            </Label>
            <Input
              id="working-height"
              type="number"
              min={VALIDATION_LIMITS.height.min}
              max={VALIDATION_LIMITS.height.max}
              value={formData.height}
              onChange={(e) => updateField('height', e.target.value)}
              className={cn(
                "bg-zinc-800 border-zinc-700 focus:border-amber-500 transition-colors",
                errors.height && "border-red-500 animate-shake",
                warnings.height && "border-yellow-500"
              )}
            />
            {errors.height && (
              <motion.p
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="text-xs text-red-400"
              >
                {errors.height}
              </motion.p>
            )}
            {warnings.height && !errors.height && (
              <motion.p
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="text-xs text-yellow-400"
              >
                {warnings.height}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-zinc-300">Color</Label>
            <div className="flex gap-6 p-2">
              <TooltipProvider delayDuration={0}>
                {COLORS.map((color) => {
                  const isSelected = formData.color === color.id;
                  return (
                    <Tooltip key={color.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          type="button"
                          onClick={() => updateField('color', color.id)}

                          animate={{
                            scale: isSelected ? 1.35 : 1,
                            filter: isSelected
                              ? `brightness(1.2) drop-shadow(0 0 8px ${color.hex}ad)`
                              : `brightness(1) drop-shadow(0 0 0px transparent)`,
                            boxShadow: isSelected
                              ? `0 0 10px ${color.hex},            
                                 0 0 25px ${color.hex}90,         
                                 0 0 50px ${color.hex}40`
                              : "0 0 0px rgba(0,0,0,0)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                          whileHover={{
                            scale: isSelected ? 1.35 : 1.15
                          }}
                          whileTap={{scale: 1.35}}
                          className={cn(
                            "w-12 h-12 rounded-full relative outline-none ring-offset-zinc-900 transition-[ring]",
                            color.className,
                            isSelected && "ring-2 ring-white ring-offset-2"
                          )}
                          style={{
                            backgroundColor: color.hex,
                            zIndex: isSelected ? 10 : 1,
                          }}
                          aria-label={color.label}
                        />
                      </TooltipTrigger>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
            {errors.color && (
              <motion.p
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="text-xs text-red-400"
              >
                {errors.color}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-zinc-300">Symbol Type</Label>
            <div className="flex gap-3">
              <TooltipProvider>
                {SYMBOL_TYPES.map(symbol => (
                  <Tooltip key={symbol.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        onClick={() => updateField('inputType', symbol.id)}
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.95}}
                        animate={formData.inputType === symbol.id ? "pulse" : ""}
                        variants={pulseVariants}
                        className={cn(
                          "w-20 h-20 rounded-xl bg-zinc-800/80 flex items-center justify-center transition-all border-2 relative overflow-hidden",
                          formData.inputType === symbol.id
                            ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-zinc-800"
                            : "border-transparent hover:border-zinc-600"
                        )}
                      >
                        <div className="w-[85%] h-[85%] relative flex items-center justify-center">
                          <img
                            src={symbol.image}
                            alt={symbol.label}
                            className={cn(
                              "w-full h-full object-contain transition-all duration-300",
                              "mix-blend-lighten contrast-125 saturate-150"
                            )}
                            style={{
                              filter: "brightness(1.1) contrast(1.1)"
                            }}
                          />
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{symbol.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
            {errors.inputType && (
              <motion.p
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className="text-xs text-red-400"
              >
                {errors.inputType}
              </motion.p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {formData.inputType === 'zebra' && (
              <motion.div
                key="zebra-params"
                variants={parameterVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="zebra-length" className="text-sm text-zinc-300">
                    Length (mm)
                  </Label>
                  <Input
                    id="zebra-length"
                    type="number"
                    min="0"
                    value={formData.zebraLength}
                    onChange={(e) => updateField('zebraLength', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 transition-colors",
                      errors.zebraLength && "border-red-500"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zebra-width" className="text-sm text-zinc-300">
                    Width (mm)
                  </Label>
                  <Input
                    id="zebra-width"
                    type="number"
                    min="0"
                    value={formData.zebraWidth}
                    onChange={(e) => updateField('zebraWidth', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 transition-colors",
                      errors.zebraWidth && "border-red-500"
                    )}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="add-gap"
                    checked={formData.addGap}
                    onCheckedChange={(checked) => updateField('addGap', checked)}
                  />
                  <Label htmlFor="add-gap" className="text-sm text-zinc-300">
                    Gap
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Gap (mm)"
                    disabled={!formData.addGap}
                    value={formData.gap}
                    onChange={(e) => updateField('gap', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 flex-1 transition-colors",
                      errors.gap && "border-red-500"
                    )}
                  />
                </div>
              </motion.div>
            )}

            {formData.inputType === 'round' && (
              <motion.div
                key="round-params"
                variants={parameterVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="round-symbol" className="text-sm text-zinc-300">
                    Real Symbol Diameter (mm)
                  </Label>
                  <Input
                    id="round-symbol"
                    type="number"
                    min="0"
                    disabled={formData.customGlassRound}
                    value={formData.realSize}
                    onChange={(e) => updateField('realSize', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 transition-colors",
                      errors.realSize && "border-red-500"
                    )}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="custom-glass-round"
                    checked={formData.customGlassRound}
                    onCheckedChange={(checked) => updateField('customGlassRound', checked)}
                  />
                  <Label htmlFor="custom-glass-round" className="text-sm text-zinc-300">
                    Custom Glass Size
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Glass Size (mm)"
                    disabled={!formData.customGlassRound}
                    value={formData.glassSizeRound}
                    onChange={(e) => updateField('glassSizeRound', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 flex-1 transition-colors",
                      errors.glassSizeRound && "border-red-500"
                    )}
                  />
                </div>
              </motion.div>
            )}

            {formData.inputType === 'triangle' && (
              <motion.div
                key="triangle-params"
                variants={parameterVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="triangle-side" className="text-sm text-zinc-300">
                    Triangle Side (mm)
                  </Label>
                  <Input
                    id="triangle-side"
                    type="number"
                    min="0"
                    disabled={formData.customGlassTriangle}
                    value={formData.triangleSide}
                    onChange={(e) => updateField('triangleSide', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 transition-colors",
                      errors.triangleSide && "border-red-500"
                    )}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="custom-glass-triangle"
                    checked={formData.customGlassTriangle}
                    onCheckedChange={(checked) => updateField('customGlassTriangle', checked)}
                  />
                  <Label htmlFor="custom-glass-triangle" className="text-sm text-zinc-300">
                    Custom Glass Size
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Glass Size (mm)"
                    disabled={!formData.customGlassTriangle}
                    value={formData.glassSizeTriangle}
                    onChange={(e) => updateField('glassSizeTriangle', e.target.value)}
                    className={cn(
                      "bg-zinc-800 border-zinc-700 flex-1 transition-colors",
                      errors.glassSizeTriangle && "border-red-500"
                    )}
                  />
                </div>
              </motion.div>
            )}

            {formData.inputType === 'lift' && (
              <motion.div
                key="lift-params"
                variants={parameterVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="lift-length" className="text-sm text-zinc-300">
                      Length (mm)
                    </Label>
                    <Input
                      id="lift-length"
                      type="number"
                      min="0"
                      value={formData.liftLength}
                      onChange={(e) => updateField('liftLength', e.target.value)}
                      className={cn(
                        "bg-zinc-800 border-zinc-700 transition-colors",
                        errors.liftLength && "border-red-500"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lift-width" className="text-sm text-zinc-300">
                      Width (mm)
                    </Label>
                    <Input
                      id="lift-width"
                      type="number"
                      min="0"
                      value={formData.liftWidth}
                      onChange={(e) => updateField('liftWidth', e.target.value)}
                      className={cn(
                        "bg-zinc-800 border-zinc-700 transition-colors",
                        errors.liftWidth && "border-red-500"
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="lift-height" className="text-sm text-zinc-300">
                      Height (mm)
                    </Label>
                    <Input
                      id="lift-height"
                      type="number"
                      min="0"
                      value={formData.liftHeight}
                      onChange={(e) => updateField('liftHeight', e.target.value)}
                      className={cn(
                        "bg-zinc-800 border-zinc-700 transition-colors",
                        errors.liftHeight && "border-red-500"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lift-capacity" className="text-sm text-zinc-300">
                      Lifting Height (mm)
                    </Label>
                    <Input
                      id="lift-capacity"
                      type="number"
                      min="0"
                      value={formData.liftCapacity}
                      onChange={(e) => updateField('liftCapacity', e.target.value)}
                      className={cn(
                        "bg-zinc-800 border-zinc-700 transition-colors",
                        errors.liftCapacity && "border-red-500"
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 pt-2">
            {isCalculating ? (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="flex items-center gap-2 text-amber-500"
              >
                <Loader2 className="w-4 h-4 animate-spin"/>
                <span className="text-sm">Calculating...</span>
              </motion.div>
            ) : isFormValid ? (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="flex items-center gap-2 text-emerald-500"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <span className="text-sm">
                  {results.length > 0 ? `${results.length} results` : 'Ready'}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-zinc-500"/>
                <span className="text-sm">Fill required fields</span>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <motion.div
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.2}}
            >
              <Button
                onClick={() => navigate('/editor')}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
              >
                Continue to Editor
                <ArrowRight className="w-4 h-4 ml-2"/>
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 border-zinc-800 bg-zinc-900/80 overflow-hidden flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-mono tracking-tight text-amber-500">
              RESULTS
              {filteredAndSortedResults.length > 0 && (
                <span className="ml-2 text-sm text-zinc-400">
                  ({filteredAndSortedResults.length})
                </span>
              )}
            </CardTitle>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-zinc-700 hover:bg-zinc-800 gap-2",
                    activeFiltersCount > 0 && "border-amber-500 text-amber-500"
                  )}
                >
                  <Filter className="w-4 h-4"/>
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-amber-500/20 text-amber-500">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-zinc-900 border-zinc-700" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-zinc-200">Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({
                        minBrightness: 0,
                        maxPrice: 5000,
                        projectorType: 'all',
                        hideRed: false,
                      })}
                      className="h-8 px-2 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Reset
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-zinc-300">
                      Min Brightness:
                    </Label>
                    <SliderCenter
                      value={[filters.minBrightness]}
                      onChange={(val) => setFilters(prev => ({...prev, minBrightness: val}))}
                      max={1000}
                      step={10}
                      extraText={"LUX"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-zinc-300">
                      Max Price:
                    </Label>
                    <SliderCenter
                      value={[filters.maxPrice]}
                      onChange={(val) => setFilters(prev => ({...prev, maxPrice: val}))}
                      min={100}
                      max={5000}
                      step={100}
                      extraText={"EUR"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-zinc-300">Projector Type</Label>
                    <Select
                      value={filters.projectorType}
                      onValueChange={(val) => setFilters(prev => ({...prev, projectorType: val}))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="25">25 Series</SelectItem>
                        <SelectItem value="100">100 Series</SelectItem>
                        <SelectItem value="300">300 Series</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hide-red"
                      checked={filters.hideRed}
                      onCheckedChange={(checked) => setFilters(prev => ({...prev, hideRed: checked}))}
                    />
                    <Label htmlFor="hide-red" className="text-sm text-zinc-300">
                      Hide low brightness results
                    </Label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-zinc-900 z-10">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead
                  onClick={() => handleSort('projector')}
                  className="cursor-pointer hover:text-amber-500 transition-colors"
                >
                  Projector <SortIcon columnKey="projector"/>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('lens')}
                  className="cursor-pointer hover:text-amber-500 transition-colors"
                >
                  Lens <SortIcon columnKey="lens"/>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('symbolLux')}
                  className="cursor-pointer hover:text-amber-500 transition-colors"
                >
                  Symbol (LUX) <SortIcon columnKey="symbolLux"/>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('price')}
                  className="cursor-pointer hover:text-amber-500 transition-colors"
                >
                  Price <SortIcon columnKey="price"/>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('symbolSize')}
                  className="cursor-pointer hover:text-amber-500 transition-colors"
                >
                  Symbol Size <SortIcon columnKey="symbolSize"/>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCalculating && results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500"/>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                    {results.length > 0
                      ? 'No results match the current filters'
                      : 'Fill in the form to see results'}
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedResults.map((result, index) => (
                    <motion.tr
                      key={`${result.projector}-${result.lens}-${index}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit={{opacity: 0, x: -20}}
                      layout
                      className={cn(
                        "border-zinc-800 transition-colors hover:bg-zinc-800/50",
                        result.resultColor === 'red' && "bg-red-500/10",
                        result.badges?.optimal && "bg-emerald-500/10"
                      )}
                    >
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {result.projector}
                          {result.badges?.optimal && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Award className="w-4 h-4 text-emerald-500"/>
                                </TooltipTrigger>
                                <TooltipContent>Optimal choice</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{result.lens}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result.symbolLux}
                          {result.badges?.brightest && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Zap className="w-4 h-4 text-yellow-500"/>
                                </TooltipTrigger>
                                <TooltipContent>Highest brightness</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          ${result.price}
                          {result.badges?.cheapest && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <DollarSign className="w-4 h-4 text-green-500"/>
                                </TooltipTrigger>
                                <TooltipContent>Best value</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{result.symbolSize}</TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
