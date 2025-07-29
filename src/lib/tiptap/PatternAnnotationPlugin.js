/**
 * Pattern Annotation Plugin
 * Adds hover annotations to pattern elements
 */

import { Plugin, PluginKey } from 'prosemirror-state';

export const PatternAnnotationPlugin = new Plugin({
  key: new PluginKey('patternAnnotation'),
  
  view(editorView) {
    return new PatternAnnotationView(editorView);
  },
});

class PatternAnnotationView {
  constructor(view) {
    this.view = view;
    this.annotationElements = new Map();
    
    // Initialize annotations for existing elements
    this.updateAnnotations();
    
    // Listen for DOM mutations to update annotations
    this.observer = new MutationObserver(() => {
      this.updateAnnotations();
    });
    
    this.observer.observe(view.dom, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-pattern-date']
    });
  }
  
  destroy() {
    this.observer.disconnect();
    this.clearAllAnnotations();
  }
  
  updateAnnotations() {
    // Find all pattern date elements
    const dateElements = this.view.dom.querySelectorAll('[data-pattern-date]');
    
    dateElements.forEach(element => {
      if (!this.annotationElements.has(element)) {
        this.addAnnotation(element);
      }
    });
    
    // Clean up annotations for removed elements
    this.annotationElements.forEach((annotation, element) => {
      if (!element.isConnected) {
        this.removeAnnotation(element);
      }
    });
  }
  
  addAnnotation(element) {
    const parsedDateStr = element.getAttribute('data-parsed-date');
    if (!parsedDateStr) return;
    
    // Create annotation element
    const annotation = document.createElement('div');
    annotation.className = 'pattern-annotation';
    annotation.style.display = 'none';
    
    // Format the date
    const formattedDate = this.formatDate(parsedDateStr);
    annotation.textContent = `(${formattedDate})`;
    
    // Position and append
    element.style.position = 'relative';
    element.appendChild(annotation);
    
    // Store reference
    this.annotationElements.set(element, annotation);
    
    // Add hover listeners
    const showAnnotation = () => {
      annotation.style.display = 'block';
    };
    
    const hideAnnotation = () => {
      annotation.style.display = 'none';
    };
    
    element.addEventListener('mouseenter', showAnnotation);
    element.addEventListener('mouseleave', hideAnnotation);
    
    // Store listeners for cleanup
    element._showAnnotation = showAnnotation;
    element._hideAnnotation = hideAnnotation;
  }
  
  removeAnnotation(element) {
    const annotation = this.annotationElements.get(element);
    if (annotation) {
      annotation.remove();
      this.annotationElements.delete(element);
      
      // Remove event listeners
      if (element._showAnnotation) {
        element.removeEventListener('mouseenter', element._showAnnotation);
        element.removeEventListener('mouseleave', element._hideAnnotation);
        delete element._showAnnotation;
        delete element._hideAnnotation;
      }
    }
  }
  
  clearAllAnnotations() {
    this.annotationElements.forEach((annotation, element) => {
      this.removeAnnotation(element);
    });
  }
  
  formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }
} 