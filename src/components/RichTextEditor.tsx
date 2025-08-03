import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  height = "200px"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const lastValueRef = useRef(value);
  const isInternalUpdate = useRef(false);

  // Check which formatting is active at cursor position
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    
    try {
      if (document.queryCommandState('bold')) formats.add('bold');
      if (document.queryCommandState('italic')) formats.add('italic');
      if (document.queryCommandState('underline')) formats.add('underline');
      if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough');
      if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
      if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');
      if (document.queryCommandState('justifyLeft')) formats.add('justifyLeft');
      if (document.queryCommandState('justifyCenter')) formats.add('justifyCenter');
      if (document.queryCommandState('justifyRight')) formats.add('justifyRight');
    } catch (error) {
      // Ignore errors in checking command state
    }
    
    setActiveFormats(formats);
  }, []);

  // Update content when value prop changes (only from external source)
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current && value !== lastValueRef.current) {
      const selection = window.getSelection();
      const wasActive = document.activeElement === editorRef.current;
      let savedRange: Range | null = null;
      
      // Save cursor position if the editor is focused
      if (wasActive && selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
      
      // Update content
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
      
      // Restore focus and cursor position
      if (wasActive) {
        editorRef.current.focus();
        
        if (savedRange) {
          try {
            selection?.removeAllRanges();
            selection?.addRange(savedRange);
          } catch (e) {
            // If restoring selection fails, place at end
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        } else {
          // Place cursor at end for new content
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        
        setTimeout(updateActiveFormats, 0);
      }
    }
  }, [value, updateActiveFormats]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const content = editorRef.current.innerHTML;
      lastValueRef.current = content;
      onChange(content);
      updateActiveFormats();
      
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 10);
    }
  }, [onChange, updateActiveFormats]);

  const execCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    
    // Ensure editor is focused
    editorRef.current.focus();
    
    // Execute command
    document.execCommand(command, false, value);
    
    // Update content immediately
    handleInput();
    
    // Update button states
    setTimeout(updateActiveFormats, 0);
  }, [handleInput, updateActiveFormats]);

  const formatBlock = useCallback((tag: string) => {
    execCommand('formatBlock', `<${tag}>`);
  }, [execCommand]);

  const createLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Insert plain text at cursor position
    document.execCommand('insertText', false, text);
    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  }, [execCommand]);

  const handleFocus = useCallback(() => {
    setIsEditorFocused(true);
    
    // If editor is empty, ensure it has some content structure
    if (editorRef.current && (!editorRef.current.innerHTML || editorRef.current.innerHTML === '')) {
      editorRef.current.innerHTML = '<br>';
    }
    
    setTimeout(updateActiveFormats, 0);
  }, [updateActiveFormats]);

  const handleBlur = useCallback(() => {
    setIsEditorFocused(false);
  }, []);

  const handleSelectionChange = useCallback(() => {
    if (document.activeElement === editorRef.current) {
      updateActiveFormats();
    }
  }, [updateActiveFormats]);

  // Listen for selection changes to update button states
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, []);

  // Get button variant based on active state
  const getButtonVariant = (format: string) => {
    return activeFormats.has(format) ? 'primary' : 'outline-secondary';
  };

  return (
    <div className="rich-text-editor-custom">
      {/* Toolbar */}
      <div className="toolbar" style={{
        border: '1px solid #ced4da',
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0',
        backgroundColor: '#f8f9fa',
        padding: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
      }}>
        {/* Text Formatting */}
        <ButtonGroup size="sm">
          <Button
            variant={getButtonVariant('bold')}
            onClick={() => execCommand('bold')}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </Button>
          <Button
            variant={getButtonVariant('italic')}
            onClick={() => execCommand('italic')}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </Button>
          <Button
            variant={getButtonVariant('underline')}
            onClick={() => execCommand('underline')}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </Button>
          <Button
            variant={getButtonVariant('strikeThrough')}
            onClick={() => execCommand('strikeThrough')}
            title="Strikethrough"
          >
            <s>S</s>
          </Button>
        </ButtonGroup>

        {/* Headers */}
        <ButtonGroup size="sm">
          <Button
            variant="outline-secondary"
            onClick={() => formatBlock('h1')}
            title="Heading 1"
          >
            H1
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => formatBlock('h2')}
            title="Heading 2"
          >
            H2
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => formatBlock('h3')}
            title="Heading 3"
          >
            H3
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => formatBlock('p')}
            title="Paragraph"
          >
            P
          </Button>
        </ButtonGroup>

        {/* Lists */}
        <ButtonGroup size="sm">
          <Button
            variant={getButtonVariant('insertUnorderedList')}
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
          >
            • List
          </Button>
          <Button
            variant={getButtonVariant('insertOrderedList')}
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
          >
            1. List
          </Button>
        </ButtonGroup>

        {/* Alignment */}
        <ButtonGroup size="sm">
          <Button
            variant={getButtonVariant('justifyLeft')}
            onClick={() => execCommand('justifyLeft')}
            title="Align Left"
          >
            ⬅
          </Button>
          <Button
            variant={getButtonVariant('justifyCenter')}
            onClick={() => execCommand('justifyCenter')}
            title="Align Center"
          >
            ↔
          </Button>
          <Button
            variant={getButtonVariant('justifyRight')}
            onClick={() => execCommand('justifyRight')}
            title="Align Right"
          >
            ➡
          </Button>
        </ButtonGroup>

        {/* Additional */}
        <ButtonGroup size="sm">
          <Button
            variant="outline-secondary"
            onClick={createLink}
            title="Insert Link"
          >
            🔗
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => execCommand('removeFormat')}
            title="Clear Formatting"
          >
            Clear
          </Button>
        </ButtonGroup>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
        style={{
          minHeight: height,
          border: '1px solid #ced4da',
          borderRadius: '0 0 8px 8px',
          padding: '12px',
          outline: 'none',
          backgroundColor: '#fff',
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderColor: isEditorFocused ? '#0d6efd' : '#ced4da',
          boxShadow: isEditorFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
          cursor: 'text'
        }}
      />

      {/* Placeholder logic */}
      {!value && !isEditorFocused && (
        <div
          style={{
            position: 'absolute',
            top: '50px', // Height of toolbar + border
            left: '13px', // Border + padding
            color: '#6c757d',
            pointerEvents: 'none',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {placeholder}
        </div>
      )}

      <style>{`
        .rich-text-editor-custom {
          position: relative;
        }
        
        .rich-text-editor-custom [contenteditable] {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .rich-text-editor-custom [contenteditable]:focus {
          outline: none;
        }
        
        .rich-text-editor-custom h1,
        .rich-text-editor-custom h2,
        .rich-text-editor-custom h3,
        .rich-text-editor-custom h4,
        .rich-text-editor-custom h5,
        .rich-text-editor-custom h6 {
          margin: 0.5em 0;
          font-weight: bold;
        }
        
        .rich-text-editor-custom h1 { font-size: 2em; }
        .rich-text-editor-custom h2 { font-size: 1.5em; }
        .rich-text-editor-custom h3 { font-size: 1.17em; }
        
        .rich-text-editor-custom p {
          margin: 0.5em 0;
        }
        
        .rich-text-editor-custom ul,
        .rich-text-editor-custom ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        
        .rich-text-editor-custom li {
          margin: 0.25em 0;
        }
        
        .rich-text-editor-custom a {
          color: #0d6efd;
          text-decoration: underline;
        }
        
        .rich-text-editor-custom blockquote {
          border-left: 4px solid #e9ecef;
          padding-left: 1em;
          margin: 1em 0;
          color: #6c757d;
        }
        
        .rich-text-editor-custom .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: white;
        }
        
        .rich-text-editor-custom .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
        
        @media (max-width: 768px) {
          .rich-text-editor-custom .toolbar {
            gap: 2px;
          }
          
          .rich-text-editor-custom .btn-group {
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor; 