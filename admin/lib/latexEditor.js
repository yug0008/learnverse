import React, { useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  HiCalculator, HiPhotograph, HiX, HiPlus, HiMinus,
  HiCode, HiChevronDown, HiChevronUp, HiPencilAlt,
  HiTrash, HiCheck, HiOutlineQuestionMarkCircle,
  HiHashtag, HiVariable, HiArrowRight, HiArrowLeft,
  HiArrowUp, HiArrowDown, HiLightningBolt
} from 'react-icons/hi';
import { 
  PiEqualsLight, PiInfinityLight, PiPercentLight,
  PiSquareRootLight, PiSigmaLight, PiNumberCircleOneLight,
  PiNumberCircleTwoLight, PiNumberCircleThreeLight,
  PiNumberCircleFourLight, PiNumberCircleFiveLight,
  PiNumberCircleSixLight, PiNumberCircleSevenLight,
  PiNumberCircleEightLight, PiNumberCircleNineLight,
  PiNumberCircleZeroLight
} from 'react-icons/pi';
import { TbMath, TbSquareRoot2, TbSum, TbDivide } from 'react-icons/tb';
import { GrPower } from 'react-icons/gr';
import Latex from 'react-latex';

// --- Utility Components ---
const Modal = ({ children, onClose, title, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${sizeClasses[size]} w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder = '', type = 'text', className = '' }) => (
  <div>
    {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
  </div>
);

// --- Math Symbol Palettes ---
const mathSymbols = [
  // Basic Operations
  { symbol: '+', name: 'Plus', latex: '+' },
  { symbol: '−', name: 'Minus', latex: '-' },
  { symbol: '×', name: 'Multiply', latex: '\\times' },
  { symbol: '÷', name: 'Divide', latex: '\\div' },
  { symbol: '=', name: 'Equals', latex: '=' },
  { symbol: '≠', name: 'Not Equal', latex: '\\neq' },
  { symbol: '≈', name: 'Approx', latex: '\\approx' },
  
  // Fractions & Roots
  { symbol: '½', name: 'Half', latex: '\\frac{1}{2}' },
  { symbol: '⅓', name: 'Third', latex: '\\frac{1}{3}' },
  { symbol: '¼', name: 'Quarter', latex: '\\frac{1}{4}' },
  { symbol: '√', name: 'Square Root', latex: '\\sqrt{}', placeholder: 'x' },
  { symbol: '∛', name: 'Cube Root', latex: '\\sqrt[3]{}', placeholder: 'x' },
  { symbol: 'ⁿ√', name: 'nth Root', latex: '\\sqrt[n]{}', placeholder: 'x' },
  
  // Greek Letters
  { symbol: 'α', name: 'Alpha', latex: '\\alpha' },
  { symbol: 'β', name: 'Beta', latex: '\\beta' },
  { symbol: 'γ', name: 'Gamma', latex: '\\gamma' },
  { symbol: 'θ', name: 'Theta', latex: '\\theta' },
  { symbol: 'π', name: 'Pi', latex: '\\pi' },
  { symbol: 'Δ', name: 'Delta', latex: '\\Delta' },
  { symbol: 'Σ', name: 'Sigma', latex: '\\Sigma' },
  { symbol: 'Ω', name: 'Omega', latex: '\\Omega' },
  
  // Calculus
  { symbol: '∫', name: 'Integral', latex: '\\int', placeholder: 'f(x)dx' },
  { symbol: '∑', name: 'Summation', latex: '\\sum_{}^{}', placeholder: 'n=1,∞' },
  { symbol: '∂', name: 'Partial', latex: '\\partial' },
  { symbol: '∞', name: 'Infinity', latex: '\\infty' },
  { symbol: '→', name: 'Limit', latex: '\\to' },
  
  // Geometry
  { symbol: '∠', name: 'Angle', latex: '\\angle' },
  { symbol: '°', name: 'Degree', latex: '^{\\circ}' },
  { symbol: '∥', name: 'Parallel', latex: '\\parallel' },
  { symbol: '⊥', name: 'Perpendicular', latex: '\\perp' },
  { symbol: '△', name: 'Triangle', latex: '\\triangle' },
  { symbol: '□', name: 'Square', latex: '\\square' },
  { symbol: '○', name: 'Circle', latex: '\\circ' },
  
  // Sets & Logic
  { symbol: '∈', name: 'In', latex: '\\in' },
  { symbol: '∉', name: 'Not In', latex: '\\notin' },
  { symbol: '⊂', name: 'Subset', latex: '\\subset' },
  { symbol: '∪', name: 'Union', latex: '\\cup' },
  { symbol: '∩', name: 'Intersection', latex: '\\cap' },
  { symbol: '∅', name: 'Empty Set', latex: '\\emptyset' },
  
  // Chemistry
  { symbol: '→', name: 'React', latex: '\\rightarrow' },
  { symbol: '⇌', name: 'Equilibrium', latex: '\\rightleftharpoons' },
  { symbol: '⇒', name: 'Implies', latex: '\\Rightarrow' },
  { symbol: '⇔', name: 'Equiv', latex: '\\Leftrightarrow' },
  { symbol: '↑', name: 'Gas', latex: '\\uparrow' },
  { symbol: '↓', name: 'Precipitate', latex: '\\downarrow' },
  
  // Superscript/Subscript
  { symbol: 'x²', name: 'Square', latex: '^{2}' },
  { symbol: 'x³', name: 'Cube', latex: '^{3}' },
  { symbol: 'xⁿ', name: 'Power', latex: '^{n}' },
  { symbol: 'x₁', name: 'Sub 1', latex: '_{1}' },
  { symbol: 'xₙ', name: 'Sub n', latex: '_{n}' },
  { symbol: '⁺', name: 'Plus Charge', latex: '^{+}' },
  { symbol: '⁻', name: 'Minus Charge', latex: '^{-}' },
  
  // Other
  { symbol: '±', name: 'Plus Minus', latex: '\\pm' },
  { symbol: '·', name: 'Dot', latex: '\\cdot' },
  { symbol: '∴', name: 'Therefore', latex: '\\therefore' },
  { symbol: '∵', name: 'Because', latex: '\\because' },
  { symbol: '%', name: 'Percent', latex: '\\%' },
  { symbol: '‰', name: 'Per Mille', latex: '\\permil' },
];

const latexTemplates = [
  { name: 'Fraction', latex: '\\frac{}{}', description: 'Create a fraction' },
  { name: 'Square Root', latex: '\\sqrt{}', description: 'Square root' },
  { name: 'Definite Integral', latex: '\\int_{}^{} \\, dx', description: 'Integral with limits' },
  { name: 'Summation', latex: '\\sum_{}^{}', description: 'Sum with limits' },
  { name: 'Limit', latex: '\\lim_{x \\to }', description: 'Limit expression' },
  { name: 'Matrix', latex: '\\begin{bmatrix}  & \\\\  & \\end{bmatrix}', description: '2x2 matrix' },
  { name: 'Vector', latex: '\\vec{}', description: 'Vector notation' },
  { name: 'Chemical Equation', latex: '\\ce{ +  ->  }', description: 'Chemical reaction' },
];

// --- Main Editor Component ---
export default function LatexEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your content...",
  label = "Content Editor",
  name = "",
  required = false,
  questionType = 'objective' // 'objective' or 'numerical'
}) {
  const [showSymbols, setShowSymbols] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Insert text at cursor position
  const insertAtCursor = useCallback((textToInsert, focusAfter = true) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = value || '';
    
    const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
    onChange(newText);
    
    if (focusAfter) {
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + textToInsert.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 10);
    }
  }, [value, onChange]);

  // Insert LaTeX symbol
  const insertSymbol = useCallback((latex, placeholder = '') => {
    let insertText = '';
    if (latex.includes('{}')) {
      // Has placeholder
      insertText = `$${latex}$`;
      insertAtCursor(insertText, false);
      
      // Move cursor to placeholder
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const position = textarea.value.indexOf(latex);
        if (position !== -1) {
          const placeholderStart = latex.indexOf('{}') + 1;
          const cursorPos = position + placeholderStart;
          textarea.focus();
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      }, 50);
    } else {
      // Simple symbol
      insertText = `$${latex}$`;
      insertAtCursor(` ${insertText} `);
    }
  }, [insertAtCursor]);

  // Insert LaTeX template
  const insertTemplate = useCallback((latex) => {
    insertAtCursor(`\n\n$$${latex}$$\n\n`);
    setShowTemplates(false);
  }, [insertAtCursor]);

  // Handle image upload
  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `question-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      // Insert image as Markdown
      insertAtCursor(`\n\n![Image](${publicUrl})\n\n`);
      setShowImageUpload(false);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Format text (bold, italic, etc.)
  const formatText = useCallback((prefix, suffix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    
    insertAtCursor(prefix + selectedText + suffix);
  }, [value, insertAtCursor]);

  // Quick insert for numerical questions
  const quickInsertNumerical = useCallback((type) => {
    switch(type) {
      case 'answer':
        insertAtCursor('\n**Answer:** ');
        break;
      case 'steps':
        insertAtCursor('\n**Step-by-Step Solution:**\n1. ');
        break;
      case 'formula':
        insertAtCursor('\n**Formula Used:** $$');
        break;
      case 'units':
        insertAtCursor(' (units)');
        break;
      default:
        break;
    }
  }, [insertAtCursor]);

  // Function to parse and render LaTeX in preview
  const renderLaTeXPreview = (content) => {
    if (!content) return null;
    
    // Split content by LaTeX blocks ($$...$$)
    const parts = content.split(/(\$\$.*?\$\$)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a LaTeX block
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latexContent = part.slice(2, -2);
        return (
          <span key={index} className="inline-block mx-1">
            <Latex>{`$$${latexContent}$$`}</Latex>
          </span>
        );
      }
      
      // Regular text - preserve line breaks
      const lines = part.split('\n');
      return lines.map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  // Function to render LaTeX in textarea-like display
  const renderLaTeXInTextArea = (content) => {
    if (!content) return null;
    
    const parts = content.split(/(\$\$.*?\$\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latexContent = part.slice(2, -2);
        return (
          <span key={index} className="inline-block px-1 mx-0.5 bg-blue-900/30 border border-blue-700/50 rounded text-blue-300 font-mono">
            <Latex>{`$$${latexContent}$$`}</Latex>
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <div className="flex items-center space-x-2">
            {questionType === 'numerical' && (
              <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-medium rounded-full">
                Numerical
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowSymbols(!showSymbols)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg flex items-center space-x-1 border border-gray-700"
            >
              <TbMath className="w-4 h-4" />
              <span>Symbols</span>
              {showSymbols ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Formatting */}
          <button
            type="button"
            onClick={() => formatText('**', '**')}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm font-bold text-white hover:bg-gray-700"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => formatText('*', '*')}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm italic text-white hover:bg-gray-700"
            title="Italic"
          >
            I
          </button>
          
          {/* LaTeX */}
          <button
            type="button"
            onClick={() => insertAtCursor('$$ $$')}
            className="px-3 py-1.5 bg-blue-900/20 border border-blue-700/50 text-blue-300 rounded text-sm hover:bg-blue-900/30 flex items-center space-x-1"
          >
            <HiCode className="w-4 h-4" />
            <span>LaTeX</span>
          </button>
          
          {/* Templates */}
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="px-3 py-1.5 bg-purple-900/20 border border-purple-700/50 text-purple-300 rounded text-sm hover:bg-purple-900/30 flex items-center space-x-1"
          >
            <HiCalculator className="w-4 h-4" />
            <span>Templates</span>
          </button>
          
          {/* Image */}
          <button
            type="button"
            onClick={() => setShowImageUpload(true)}
            className="px-3 py-1.5 bg-green-900/20 border border-green-700/50 text-green-300 rounded text-sm hover:bg-green-900/30 flex items-center space-x-1"
          >
            <HiPhotograph className="w-4 h-4" />
            <span>Image</span>
          </button>
          
          {/* Quick Actions for Numerical */}
          {questionType === 'numerical' && (
            <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Quick:</span>
              <button
                type="button"
                onClick={() => quickInsertNumerical('answer')}
                className="px-2 py-1 bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded text-xs hover:bg-yellow-900/30"
              >
                Answer
              </button>
              <button
                type="button"
                onClick={() => quickInsertNumerical('steps')}
                className="px-2 py-1 bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded text-xs hover:bg-yellow-900/30"
              >
                Steps
              </button>
              <button
                type="button"
                onClick={() => quickInsertNumerical('formula')}
                className="px-2 py-1 bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded text-xs hover:bg-yellow-900/30"
              >
                Formula
              </button>
            </div>
          )}
        </div>

        {/* Symbol Palette */}
        {showSymbols && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-300">Math Symbols</h4>
              <div className="flex space-x-1">
                <span className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded border border-gray-700">Click to insert</span>
              </div>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-40 overflow-y-auto p-1">
              {mathSymbols.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertSymbol(item.latex, item.placeholder)}
                  className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-blue-900/30 hover:border-blue-600 flex flex-col items-center justify-center min-h-[40px] transition-colors"
                  title={item.name}
                >
                  <span className="text-lg font-medium text-white">{item.symbol}</span>
                  <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          name={name}
          required={required}
          rows={8}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono resize-y"
        />
        {/* Inline LaTeX preview overlay for textarea */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden px-4 py-3">
          <div className="text-white font-mono whitespace-pre-wrap break-words opacity-0">
            {value || ''}
          </div>
          <div className="absolute inset-0 px-4 py-3 overflow-auto">
            <div className="text-white font-mono whitespace-pre-wrap break-words">
              {renderLaTeXInTextArea(value || '')}
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="mt-2 p-4 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-300">Live Preview</h4>
          <span className="text-xs text-gray-400">
            {value?.length || 0} characters
          </span>
        </div>
        <div className="text-gray-200 bg-gray-800/50 rounded p-3 min-h-[60px]">
          {value ? (
            renderLaTeXPreview(value)
          ) : (
            <span className="text-gray-500 italic">Preview will appear here...</span>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-400">
        <p className="flex items-center space-x-1">
          <HiLightningBolt className="w-3 h-3" />
          <span><strong className="text-gray-300">Tip:</strong> Use $$...$$ for LaTeX blocks. Click symbols to insert them directly.</span>
        </p>
        {questionType === 'numerical' && (
          <p className="mt-1">
            <strong className="text-gray-300">For Numerical:</strong> Include units, step-by-step solutions, and relevant formulas.
          </p>
        )}
      </div>

      {/* Modals */}
      {showTemplates && (
        <Modal
          title="LaTeX Templates"
          onClose={() => setShowTemplates(false)}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
              Select a template to insert. Fill the placeholders with your content.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {latexTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => insertTemplate(template.latex)}
                  className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-blue-900/30 hover:border-blue-600 text-left transition-colors"
                >
                  <div className="font-medium text-white">{template.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                  <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                    <Latex>{`$$${template.latex}$$`}</Latex>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showImageUpload && (
        <Modal
          title="Upload Image"
          onClose={() => setShowImageUpload(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
              Upload an image for your question. Max size: 5MB
            </p>
            
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <HiPhotograph className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                Drag & drop or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Choose File
              </button>
            </div>
            
            {imageUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Or enter image URL:
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={imageUrl}
                    onChange={setImageUrl}
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl) {
                        insertAtCursor(`\n\n![Image](${imageUrl})\n\n`);
                        setImageUrl('');
                        setShowImageUpload(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Insert
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Quick Editor for Options (Simplified) ---
export function QuickOptionEditor({ value, onChange, label, id }) {
  const textareaRef = useRef(null);

  const insertAtCursor = useCallback((text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = value || '';
    
    const newText = currentText.substring(0, start) + text + currentText.substring(end);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 10);
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => insertAtCursor('$$ $$')}
          className="px-2 py-1 bg-blue-900/20 border border-blue-700/50 text-blue-300 rounded text-xs hover:bg-blue-900/30"
        >
          LaTeX
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\\frac{}{}')}
          className="px-2 py-1 bg-blue-900/20 border border-blue-700/50 text-blue-300 rounded text-xs hover:bg-blue-900/30"
        >
          Fraction
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\\sqrt{}')}
          className="px-2 py-1 bg-blue-900/20 border border-blue-700/50 text-blue-300 rounded text-xs hover:bg-blue-900/30"
        >
          √ Root
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter option text..."
        rows={3}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

// --- Numerical Answer Input ---
export function NumericalAnswerInput({ value, onChange, label = "Correct Answer" }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="flex space-x-3">
        <div className="flex-1">
          <Input
            value={value.answer || ''}
            onChange={(val) => onChange({ ...value, answer: val })}
            placeholder="Enter numerical value"
            type="number"
            step="any"
          />
        </div>
        <div className="w-32">
          <Input
            label="Units"
            value={value.units || ''}
            onChange={(val) => onChange({ ...value, units: val })}
            placeholder="m/s, kg, etc."
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tolerance (±)
          </label>
          <select
            value={value.tolerance || '0'}
            onChange={(e) => onChange({ ...value, tolerance: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="0">Exact</option>
            <option value="0.01">±0.01</option>
            <option value="0.1">±0.1</option>
            <option value="1">±1</option>
            <option value="5">±5%</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      {value.tolerance === 'custom' && (
        <div className="mt-2">
          <Input
            label="Custom Tolerance"
            value={value.customTolerance || ''}
            onChange={(val) => onChange({ ...value, customTolerance: val })}
            placeholder="e.g., 0.05 or 2%"
          />
        </div>
      )}
    </div>
  );
}