import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';

export interface ComboboxOption {
  id?: string | number;
  label: string;
  sublabel?: string;
  meta?: any;
}

interface EditableComboboxProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectOption?: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  createNewText?: string;
  emptyText?: string;
  autoFocus?: boolean;
}

export const EditableCombobox: React.FC<EditableComboboxProps> = ({
  id,
  name,
  value,
  onChange,
  onSelectOption,
  options,
  placeholder = 'Type to search or enter a new name...',
  required = false,
  disabled = false,
  className = '',
  createNewText = 'Use new name',
  emptyText = 'No matching records. Press Enter or submit to use this new name.',
  autoFocus = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on typed value
  const trimmedValue = value.trim().toLowerCase();
  const filteredOptions = options.filter(opt => {
    if (!trimmedValue) return true;
    const labelMatch = opt.label.toLowerCase().includes(trimmedValue);
    const sublabelMatch = opt.sublabel ? opt.sublabel.toLowerCase().includes(trimmedValue) : false;
    return labelMatch || sublabelMatch;
  });

  // Check if current value exactly matches any option
  const exactMatch = options.some(opt => opt.label.trim().toLowerCase() === trimmedValue);
  const showCreateOption = trimmedValue.length > 0 && !exactMatch;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.label);
    if (onSelectOption) {
      onSelectOption(option);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        const totalItems = filteredOptions.length + (showCreateOption ? 1 : 0);
        setHighlightedIndex(prev => (prev + 1) % Math.max(1, totalItems));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        const totalItems = filteredOptions.length + (showCreateOption ? 1 : 0);
        setHighlightedIndex(prev => (prev - 1 + totalItems) % Math.max(1, totalItems));
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (highlightedIndex === filteredOptions.length && showCreateOption) {
          e.preventDefault();
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-3 pr-16 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Toggle suggestions"
            tabIndex={-1}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Suggestions Popover */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
          {/* Header indicator */}
          <div className="px-3 py-1.5 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>{filteredOptions.length > 0 ? `${filteredOptions.length} existing record${filteredOptions.length > 1 ? 's' : ''}` : 'No exact record match'}</span>
            <span className="text-slate-500">Click to select or keep typing</span>
          </div>

          {/* If there are options */}
          {filteredOptions.length > 0 && (
            <div className="py-1">
              {filteredOptions.map((opt, idx) => {
                const isSelected = opt.label.trim().toLowerCase() === trimmedValue;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={opt.id ?? `opt-${idx}`}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-slate-800 text-white'
                        : isSelected
                        ? 'bg-emerald-950/30 text-emerald-300'
                        : 'text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {isSelected && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Selected</span>}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* If user typed a new string not matching any option */}
          {showCreateOption && (
            <div className="p-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  inputRef.current?.blur();
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0 truncate">
                  <span className="font-bold">{createNewText}:</span> <span className="underline italic font-medium">"{value.trim()}"</span>
                </div>
              </button>
            </div>
          )}

          {/* Empty state with helpful hint */}
          {filteredOptions.length === 0 && !showCreateOption && (
            <div className="px-3 py-3 text-center text-xs text-slate-400">
              {emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
