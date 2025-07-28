  // URL normalization function with protocol addition
  function normalizeUrl(url) {
    if (!url || !url.trim()) return '';
    
    const trimmed = url.trim();
    
    // Add https:// if no protocol is present
    if (!trimmed.match(/^https?:\/\//i)) {
      return 'https://' + trimmed;
    }
    
    return trimmed;
  }
  
  // Enhanced applyLink function with URL validation
  function applyLink() {
    const normalizedUrl = normalizeUrl(linkUrl);
    if (!normalizedUrl) return;
    
    if (editor) {
      const { from, to } = editor.state.selection;
      
      if (isEditingLink) {
        // Update existing link (when editing via bubble menu)
        editor.commands.updateAttributes('link', { href: normalizedUrl });
      } else if (from === to) {
        // No text selected, insert link with URL as text
        editor.commands.insertContent(`<a href="${normalizedUrl}">${normalizedUrl}</a>`);
      } else {
        // Text selected, apply link to selection
        editor.commands.setLink({ href: normalizedUrl });
      }
      
      // Clean up state
      showLinkMenu = false;
      linkUrl = '';
      isEditingLink = false;
      
      // Focus back to editor
      setTimeout(() => {
        if (editor) {
          editor.commands.focus();
        }
      }, 100);
    }
  }
